import { createContext, PropsWithChildren, useContext } from "react"
import { useStore } from "~/hooks"
import { ContextStore, InitialState, Options, Translations } from "~/types/lib"

export function initTranslations<T extends Translations>(translations: T, options: Options<T>) {
    const Context = createContext<ContextStore<T> | undefined>(undefined)

    function TranslationProvider({ children, initialState }: PropsWithChildren<{ initialState?: InitialState<T> }>) {
        return <Context.Provider value={useStore(translations, options, initialState)}>{children}</Context.Provider>
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
