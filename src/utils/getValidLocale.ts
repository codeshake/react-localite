import { Locale, Translations } from "~/types/lib"

export const getValidLocale = <T extends Translations>(
    translations: T,
    userLocale: Locale | keyof T,
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
