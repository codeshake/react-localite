import { useCallback, useMemo, useState } from "react"
import { KEY_PATH_SEPARATOR } from "~/constants"
import { ContextStore, InitialState, Options, Translations } from "~/types/lib"
import { findInDictByJoinedKey, getLocaleLocalStorage, getValidLocale, renderTemplate } from "~/utils"
import { useDictionary } from "./useDictionary"

export const useStore = <T extends Translations>(
    translations: T,
    { fallbackLocale, localeStorage = getLocaleLocalStorage("local"), onError = console.error }: Options<T>,
    initialState?: InitialState<T>,
): ContextStore<T> => {
    const [userLocale, setUserLocale] = useState(() => initialState?.locale ?? localeStorage.get())

    const locale = useMemo(() => {
        return getValidLocale(translations, userLocale, fallbackLocale)
    }, [translations, userLocale, fallbackLocale])

    const { dict, isLoading } = useDictionary(translations[locale] satisfies T[keyof T], onError, initialState?.dict)

    const setLocale = useCallback(
        (nextLocale: keyof T) => {
            if (typeof nextLocale !== "string") {
                throw new TypeError("Only string available")
            }

            setUserLocale(nextLocale)
            localeStorage.set(nextLocale)
        },
        [localeStorage],
    )

    return useCallback(
        globalKey => {
            return {
                isLoading,
                locale,
                setLocale,
                t: (key, ...parameters) => {
                    if (!dict) return key

                    const template = findInDictByJoinedKey(
                        dict,
                        [globalKey, key].filter(Boolean).join(KEY_PATH_SEPARATOR),
                        onError,
                    )

                    return renderTemplate(template, onError, ...parameters)
                },
            }
        },
        [isLoading, locale, setLocale, dict, onError],
    )
}
