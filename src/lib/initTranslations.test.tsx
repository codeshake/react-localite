import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useStore } from "~/hooks"
import { initTranslations } from "./initTranslations"

vi.mock("~/hooks", () => ({
    useStore: vi.fn(),
}))

describe("initTranslations", () => {
    const translations = {
        en: {
            hello: "Hello",
        },
    }

    it("creates TranslationProvider and useTranslation", () => {
        const { TranslationProvider, useTranslation } = initTranslations(translations, {
            fallbackLocale: "en",
        })

        expect(TranslationProvider).toBeTypeOf("function")
        expect(useTranslation).toBeTypeOf("function")
    })

    it("passes store from useStore through context", () => {
        const storeItem = {
            locale: "en",
            t: vi.fn(),
        }

        const store = vi.fn(() => storeItem)

        vi.mocked(useStore).mockReturnValue(store as never)

        const { TranslationProvider, useTranslation } = initTranslations(translations, {
            fallbackLocale: "en",
        })

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <TranslationProvider>{children}</TranslationProvider>
        )

        const { result } = renderHook(() => useTranslation("home" as never), {
            wrapper,
        })

        expect(store).toHaveBeenCalledWith("home")
        expect(result.current).toBe(storeItem)
    })

    it("passes initialState to TranslationProvider", () => {
        const store = vi.fn()

        vi.mocked(useStore).mockReturnValue(store)

        const { TranslationProvider } = initTranslations(translations, {
            fallbackLocale: "en",
        })

        const initialState = {
            locale: "en",
            dict: translations.en,
        } as const

        renderHook(() => null, {
            wrapper: ({ children }) => (
                <TranslationProvider initialState={initialState}>{children}</TranslationProvider>
            ),
        })

        expect(useStore).toHaveBeenCalledWith(translations, { fallbackLocale: "en" }, initialState)
    })

    it("throws when useTranslation is used outside provider", () => {
        const { useTranslation } = initTranslations(translations, {
            fallbackLocale: "en",
        })

        expect(() => renderHook(() => useTranslation())).toThrow(
            "useTranslation was called out of TranslationProvider scope",
        )
    })
})
