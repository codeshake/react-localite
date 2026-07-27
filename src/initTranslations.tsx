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

type Options<T extends Translations> = {
    fallbackLocale: keyof T
    localeStorage?: LocaleStorage
    debug?: boolean,
    // events: onMissingKey, onMissingLang
}

type ContextStore = (globalKey?: string) => {
    locale: string
    setLocale: (locale: string) => void
    isLoading: boolean
    t: (key: string) => string
}

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

const useStore = <T extends Translations>(
    translations: T,
    {
        fallbackLocale,
        localeStorage = defaultLocaleStorage,
        debug = true,
    }: Options<T>,
): ContextStore => {
    const [userLocale, setUserLocale] = useState(localeStorage.get)

    const { dict, locale, isLoading } = useTranslations(translations, userLocale, fallbackLocale)

    return globalKey => {
        return {
            locale,
            setLocale: nextLocale => {
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
    const Context = createContext<ContextStore | undefined>(undefined)

    function TranslationProvider({ children }: PropsWithChildren) {
        return <Context.Provider value={useStore(translations, options)}>{ children }</Context.Provider>
    }

    const useTranslation = (globalKey?: string) => {
        const contextItem = useContext(Context)

        if (!contextItem) {
            throw new Error(`useTranslation was called out of TranslationProvider scope`)
        }

        return contextItem(globalKey)
    }

    return { TranslationProvider, useTranslation }
}
