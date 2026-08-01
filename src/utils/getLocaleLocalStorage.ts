import { LocaleStorage } from "~/types/lib"

export const getLocaleLocalStorage = (key: string): LocaleStorage => {
    return {
        get: () => {
            if (typeof window === "undefined") return undefined

            try {
                return localStorage.getItem(key) ?? [...navigator.languages]
            } catch {
                return [...navigator.languages]
            }
        },
        set: locale => {
            try {
                localStorage.setItem(key, locale)
            } catch {
                // silent catch
            }
        },
    }
}
