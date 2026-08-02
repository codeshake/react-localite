import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useDictionary } from "./useDictionary"
import { useStore } from "./useStore"

vi.mock("./useDictionary", () => ({
    useDictionary: vi.fn(),
}))

describe("useStore", () => {
    const translations = {
        en: {
            hello: "Hello",
        },
        ru: {
            hello: "Привет",
        },
    }

    const dict = {
        hello: "Hello {{name}}",
    }

    it("returns translation store", () => {
        vi.mocked(useDictionary).mockReturnValue({
            dict,
            isLoading: false,
        })

        const localeStorage = {
            get: vi.fn().mockReturnValue("en"),
            set: vi.fn(),
        }

        const { result } = renderHook(() =>
            useStore(translations, {
                fallbackLocale: "en",
                localeStorage,
            }),
        )

        const store = result.current()

        expect(store.locale).toBe("en")
        expect(store.isLoading).toBe(false)
        expect(store.t("hello", { name: "user" })).toBe("Hello user")
    })

    it("uses fallback locale when stored locale is invalid", () => {
        vi.mocked(useDictionary).mockReturnValue({
            dict,
            isLoading: false,
        })

        const localeStorage = {
            get: vi.fn().mockReturnValue("de"),
            set: vi.fn(),
        }

        const { result } = renderHook(() =>
            useStore(translations, {
                fallbackLocale: "ru",
                localeStorage,
            }),
        )

        expect(result.current().locale).toBe("ru")
    })

    it("uses initial state locale", () => {
        vi.mocked(useDictionary).mockReturnValue({
            dict,
            isLoading: false,
        })

        const localeStorage = {
            get: vi.fn().mockReturnValue("en"),
            set: vi.fn(),
        }

        const { result } = renderHook(() =>
            useStore(
                translations,
                {
                    fallbackLocale: "en",
                    localeStorage,
                },
                {
                    locale: "ru",
                    dict: translations.ru,
                },
            ),
        )

        expect(result.current().locale).toBe("ru")
        expect(localeStorage.get).not.toHaveBeenCalled()
    })

    it("passes initial dictionary to useDictionary", () => {
        vi.mocked(useDictionary).mockReturnValue({
            dict,
            isLoading: false,
        })

        const initialDict = {
            hello: "Initial",
        }

        renderHook(() =>
            useStore(
                translations,
                {
                    fallbackLocale: "en",
                },
                {
                    locale: "en",
                    dict: initialDict,
                },
            ),
        )

        expect(useDictionary).toHaveBeenCalledWith(translations.en, expect.any(Function), initialDict)
    })

    it("changes locale and saves it", () => {
        vi.mocked(useDictionary).mockReturnValue({
            dict,
            isLoading: false,
        })

        const localeStorage = {
            get: vi.fn().mockReturnValue("en"),
            set: vi.fn(),
        }

        const { result } = renderHook(() =>
            useStore(translations, {
                fallbackLocale: "en",
                localeStorage,
            }),
        )

        act(() => {
            result.current().setLocale("ru")
        })

        expect(localeStorage.set).toHaveBeenCalledWith("ru")
        expect(result.current().locale).toBe("ru")
    })

    it("throws when setting non-string locale", () => {
        vi.mocked(useDictionary).mockReturnValue({
            dict,
            isLoading: false,
        })

        const { result } = renderHook(() =>
            useStore(translations, {
                fallbackLocale: "en",
            }),
        )

        expect(() => result.current().setLocale(123 as never)).toThrow(TypeError)
    })

    it("returns key when dictionary is not loaded", () => {
        vi.mocked(useDictionary).mockReturnValue({
            dict: undefined,
            isLoading: true,
        })

        const { result } = renderHook(() =>
            useStore(translations, {
                fallbackLocale: "en",
            }),
        )

        expect(result.current().t("hello")).toBe("hello")
    })
})
