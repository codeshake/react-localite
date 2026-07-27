import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react"

export type Locale = string | string[] | undefined

export type LocaleStorage = {
    get: () => Locale
    set: (locale: string) => void
}

const defaultLocaleStorage: LocaleStorage = {
    get: () => localStorage.getItem("locale") ?? [...navigator.languages],
    set: locale => localStorage.setItem("locale", locale),
}

type Dictionary = {
    [key: string]: string | Dictionary
}

type DictionaryLoadItem = (() => Promise<{ default: Dictionary }>) | (() => Dictionary) | Dictionary

type Translations = Record<string, DictionaryLoadItem>

const getValidLocale = <T extends Translations>(
    translations: T,
    userLocale: Locale,
    fallbackLocale: keyof T,
): keyof T => {
    if (Array.isArray(userLocale)) {
        for (const localeItem of userLocale) {
            if (Object.hasOwn(translations, localeItem)) {
                return localeItem as keyof T
            }
        }
    } else if (userLocale && Object.hasOwn(translations, userLocale)) {
        return userLocale as keyof T
    }

    return fallbackLocale
}

const getResourceData = async <D extends DictionaryLoadItem>(resource: D): Promise<Dictionary> => {
    if (typeof resource === "function") {
        const result = resource()

        if (result instanceof Promise) {
            const { default: promiseResult } = await result

            return promiseResult
        }

        return result
    }

    return resource
}

const useTranslations = <T extends Translations>(
    translations: T,
    userLocale: Locale,
    fallbackLocale: keyof T,
) => {
    const [isLoading, setIsLoading] = useState(false)
    const [dict, setDict] = useState<Dictionary>()
    const [locale, setLocale] = useState(() => getValidLocale(translations, userLocale, fallbackLocale))

    const load = useCallback(async () => {
        setIsLoading(true)

        try {
            const validLocale = getValidLocale(translations, userLocale, fallbackLocale)
            const resourceData = await getResourceData(translations[validLocale])

            setDict(resourceData)
            setLocale(validLocale)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [translations, locale, fallbackLocale])

    useEffect(() => {
        load()
    }, [load])

    return { dict, locale, isLoading }
}

type Options<T extends Translations> = {
    fallbackLocale: keyof T
    localeStorage?: LocaleStorage
    debug?: boolean,
    // events: onMissingKey, onMissingLang
}

type ContextStore<T extends Translations> = (globalKey?: string) => {
    locale: keyof T
    setLocale: (locale: keyof T) => void
    isLoading: boolean
    t: (key: string) => string
}

const useStore = <T extends Translations>(
    translations: T,
    {
        fallbackLocale,
        localeStorage = defaultLocaleStorage,
        debug = true,
    }: Options<T>,
): ContextStore<T> => {
    const [userLocale, setUserLocale] = useState(localeStorage.get)

    const { dict, locale, isLoading } = useTranslations(translations, userLocale, fallbackLocale)

    console.log(debug, dict)

    return globalKey => {
        console.log(globalKey)

        return {
            locale,
            setLocale: nextLocale => {
                if (typeof nextLocale !== "string") {
                    throw new Error("Only string available")
                }

                setUserLocale(nextLocale)
                localeStorage.set(nextLocale)
            },
            isLoading,
            t: (key: string) => key,
        }
    }
}

export function initTranslations<T extends Translations>(
    translations: T,
    options: Options<T>,
) {
    const Context = createContext<ContextStore<T> | undefined>(undefined)

    function TranslationProvider({ children }: PropsWithChildren) {
        return <Context.Provider value={useStore(translations, options)}>{ children }</Context.Provider>
    }

    const useTranslation: ContextStore<T> = (...parameters) => {
        const contextItem = useContext(Context)

        if (!contextItem) {
            throw new Error(`useTranslation was called out of TranslationProvider scope`)
        }

        return contextItem(...parameters)
    }

    return { TranslationProvider, useTranslation }
}
