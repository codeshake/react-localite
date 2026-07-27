import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react"

const JOIN_SIGN = "."
const OPEN_TAG = "{{"
const CLOSE_TAG = "}}"

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

type DictionaryUnwrap<T extends DictionaryLoadItem> = T extends Dictionary
    ? T
    : T extends () => Dictionary
      ? ReturnType<T>
      : T extends () => Promise<{ default: infer D }>
        ? D
        : never

type Translations = Record<string, DictionaryLoadItem>

const getValidLocale = <T extends Translations>(
    translations: T,
    userLocale: Locale,
    fallbackLocale: keyof T,
): keyof T => {
    if (Array.isArray(userLocale)) {
        for (const localeItem of userLocale) {
            if (Object.hasOwn(translations, localeItem)) {
                return localeItem satisfies keyof T
            }
        }
    } else if (userLocale && Object.hasOwn(translations, userLocale)) {
        return userLocale satisfies keyof T
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

const useTranslations = <T extends Translations>(translations: T, userLocale: Locale, fallbackLocale: keyof T) => {
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
    }, [fallbackLocale, translations, userLocale])

    useEffect(() => {
        load()
    }, [load])

    return { dict, locale, isLoading }
}

const appendParameters = (template: string, parameters: Record<string, string> = {}) => {
    let result = template
    let cursor = 0

    while (true) {
        const left = result.indexOf(OPEN_TAG, cursor)

        if (left === -1) break

        const right = result.indexOf(CLOSE_TAG, left + OPEN_TAG.length)

        if (right === -1) break

        const key = result.slice(left + OPEN_TAG.length, right).trim()

        let replacement = parameters[key]

        if (!replacement) {
            console.error(`Variable "${key}" wasn't found for "${template}"`)
            replacement = key
        }

        result = result.slice(0, left) + replacement + result.slice(right + CLOSE_TAG.length)

        cursor = left + replacement.length
    }

    return result
}

const findInDictByJoinedKey = (dict: Dictionary, key: string, parameters?: Record<string, string>) => {
    const keyParts = key.split(JOIN_SIGN)

    let currentLevel = dict
    let pickKey: string | undefined

    while ((pickKey = keyParts.shift())) {
        const node = currentLevel[pickKey]

        if (typeof node === "string") {
            return appendParameters(node, parameters)
        }

        if (node == null) {
            break
        } else {
            currentLevel = node
        }
    }

    console.error(`Key "${key}" not found in the dict.`, dict)

    return key
}

type LeafDotObjectKeys<T extends object> = {
    [K in keyof T & string]: T[K] extends object ? K | `${K}${typeof JOIN_SIGN}${LeafDotObjectKeys<T[K]>}` : never
}[keyof T & string]

type LeafDotValueKeys<T extends object> = {
    [K in keyof T & string]: T[K] extends object ? `${K}${typeof JOIN_SIGN}${LeafDotValueKeys<T[K]>}` : K
}[keyof T & string]

type Split<Value extends string, Delimiter extends string> = string extends Value
    ? string[]
    : Value extends ""
      ? []
      : Value extends `${infer T}${Delimiter}${infer U}`
        ? [T, ...Split<U, Delimiter>]
        : [Value]

type ValueByNestedKey<PathArray, Dict extends Dictionary> = PathArray extends [infer First, ...infer Rest]
    ? First extends string
        ? Dict[First] extends Dictionary
            ? ValueByNestedKey<Rest, Dict[First]>
            : Dict[First]
        : never
    : Dict

type Whitespace = " " | "\n" | "\t" | "\r"

type TrimLeft<S extends string> = S extends `${Whitespace}${infer Rest}` ? TrimLeft<Rest> : S

type TrimRight<S extends string> = S extends `${infer Rest}${Whitespace}` ? TrimRight<Rest> : S

type Trim<S extends string> = TrimLeft<TrimRight<S>>

type DictValueVariables<Value, Parameters = {}> = Value extends `${infer _}${typeof OPEN_TAG}${infer Variable}${typeof CLOSE_TAG}${infer Rest}`
    ? DictValueVariables<Rest, Parameters & Record<Trim<Variable>, string>>
    : Parameters

type DictParametersToArray<Value> = keyof Value extends never ? [] : [Value]

type Options<T extends Translations> = {
    fallbackLocale: keyof T
    localeStorage?: LocaleStorage
    debug?: boolean
    // events: onMissingKey, onMissingLang
}

type ContextStore<T extends Translations, D extends Dictionary = DictionaryUnwrap<T[keyof T]>> = <
    GKey extends LeafDotObjectKeys<D> | undefined = undefined,
    Dict extends Dictionary = GKey extends LeafDotObjectKeys<D> ? ValueByNestedKey<Split<GKey, typeof JOIN_SIGN>, D> : D
>(
    globalKey?: GKey,
) => {
    locale: keyof T
    setLocale: (locale: keyof T) => void
    isLoading: boolean
    t: <TKey extends LeafDotValueKeys<Dict>>(
        key: TKey,
        ...parameters: DictParametersToArray<DictValueVariables<ValueByNestedKey<Split<TKey, typeof JOIN_SIGN>, Dict>>>
    ) => string
}

const useStore = <T extends Translations>(
    translations: T,
    {
        fallbackLocale,
        localeStorage = defaultLocaleStorage,
        // debug = true,
    }: Options<T>,
): ContextStore<T> => {
    const [userLocale, setUserLocale] = useState(localeStorage.get)

    const { dict, locale, isLoading } = useTranslations(translations, userLocale, fallbackLocale)

    return globalKey => {
        return {
            isLoading,
            locale,
            setLocale: nextLocale => {
                if (typeof nextLocale !== "string") {
                    throw new TypeError("Only string available")
                }

                setUserLocale(nextLocale)
                localeStorage.set(nextLocale)
            },
            t: (key: string, ...parameters) => {
                if (!dict) {
                    return key
                }

                return findInDictByJoinedKey(dict, [globalKey, key].filter(Boolean).join(JOIN_SIGN), ...parameters)
            },
        }
    }
}

export function initTranslations<T extends Translations>(translations: T, options: Options<T>) {
    const Context = createContext<ContextStore<T> | undefined>(undefined)

    function TranslationProvider({ children }: PropsWithChildren) {
        return <Context.Provider value={useStore(translations, options)}>{children}</Context.Provider>
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
