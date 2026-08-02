import { describe, expect, it } from "vitest"
import { getValidLocale } from "./getValidLocale"

describe("getValidLocale", () => {
    const translations = {
        en: {},
        fr: {},
        de: {},
    }

    it("returns locale when it exists", () => {
        const result = getValidLocale(translations, "fr", "en")

        expect(result).toBe("fr")
    })

    it("returns the first matching locale from an array", () => {
        const result = getValidLocale(translations, ["es", "de", "fr"], "en")

        expect(result).toBe("de")
    })

    it("returns fallback locale when locale does not exist", () => {
        const result = getValidLocale(translations, "es", "en")

        expect(result).toBe("en")
    })

    it("returns fallback locale when no locales in array exist", () => {
        const result = getValidLocale(translations, ["es", "it"], "en")

        expect(result).toBe("en")
    })

    it("returns fallback locale for an empty locale array", () => {
        const result = getValidLocale(translations, [], "en")

        expect(result).toBe("en")
    })

    it("returns fallback locale when locale is undefined", () => {
        const result = getValidLocale(translations, undefined, "en")

        expect(result).toBe("en")
    })

    it("returns fallback locale when locale is an empty string", () => {
        const result = getValidLocale(translations, "", "en")

        expect(result).toBe("en")
    })
})
