import { createContext, PropsWithChildren, useContext } from "react"

export type LocaleStorage = {
    get: () => string | string[] | readonly string[]
    set: (locale: string) => void
}

const defaultLocaleStorage: LocaleStorage = {
    get: () => localStorage.getItem("locale") ?? navigator.languages,
    set: locale => localStorage.setItem("locale", locale),
}

type Translations = {
    [key: string]: string | Translations
}

type TranslationsList = Record<string, () => Promise<Translations> | (() => Translations) | Translations>

type Options<TList extends TranslationsList> = {
    fallbackLang: keyof TList
    localeStorage?: LocaleStorage
    debug?: boolean,
    // events: onMissingKey, onMissingLang
}

type ContextStore = {}

const useStore = <TList extends TranslationsList>(
    translations: TList,
    {
        fallbackLang,
        localeStorage = defaultLocaleStorage,
        debug = true,
    }: Options<TList>,
): ContextStore => {
    console.log(translations, fallbackLang, localeStorage)

    return {}
}

export function initTranslations<TList extends TranslationsList>(
    translations: TList,
    options: Options<TList>,
) {
    const Context = createContext<ContextStore | undefined>(undefined)

    function TranslationProvider({ children }: PropsWithChildren) {
        return <Context.Provider value={useStore(translations, options)}>{ children }</Context.Provider>
    }

    const useTranslation = () => {
        const contextItem = useContext(Context)

        if (!contextItem) {
            throw new Error(`useTranslation was called out of TranslationProvider scope`)
        }

        return contextItem
    }

    return { TranslationProvider, useTranslation }
}
