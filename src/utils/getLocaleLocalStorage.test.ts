import { beforeEach, describe, expect, it, vi } from "vitest"
import { getLocaleLocalStorage } from "./getLocaleLocalStorage"

describe("getLocaleLocalStorage", () => {
    const key = "locale"

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it("returns stored locale", () => {
        vi.stubGlobal("window", {})

        const getItem = vi.fn().mockReturnValue("en")

        vi.stubGlobal("localStorage", {
            getItem,
            setItem: vi.fn(),
        })

        vi.stubGlobal("navigator", {
            languages: ["fr", "de"],
        })

        const storage = getLocaleLocalStorage(key)

        expect(storage.get()).toBe("en")
        expect(getItem).toHaveBeenCalledWith(key)
    })

    it("returns navigator.languages when nothing is stored", () => {
        vi.stubGlobal("window", {})

        vi.stubGlobal("localStorage", {
            getItem: vi.fn().mockReturnValue(null),
            setItem: vi.fn(),
        })

        vi.stubGlobal("navigator", {
            languages: ["fr", "de"],
        })

        const storage = getLocaleLocalStorage(key)

        expect(storage.get()).toEqual(["fr", "de"])
    })

    it("returns navigator.languages when localStorage.getItem throws", () => {
        vi.stubGlobal("window", {})

        vi.stubGlobal("localStorage", {
            getItem: vi.fn(() => {
                throw new Error("boom")
            }),
            setItem: vi.fn(),
        })

        vi.stubGlobal("navigator", {
            languages: ["fr", "de"],
        })

        const storage = getLocaleLocalStorage(key)

        expect(storage.get()).toEqual(["fr", "de"])
    })

    it("returns undefined when window is unavailable", () => {
        vi.stubGlobal("window", undefined)

        const storage = getLocaleLocalStorage(key)

        expect(storage.get()).toBeUndefined()
    })

    it("stores locale", () => {
        const setItem = vi.fn()

        vi.stubGlobal("localStorage", {
            getItem: vi.fn(),
            setItem,
        })

        const storage = getLocaleLocalStorage(key)

        storage.set("en")

        expect(setItem).toHaveBeenCalledWith(key, "en")
    })

    it("does not throw when localStorage.setItem throws", () => {
        vi.stubGlobal("localStorage", {
            getItem: vi.fn(),
            setItem: vi.fn(() => {
                throw new Error("boom")
            }),
        })

        const storage = getLocaleLocalStorage(key)

        expect(() => storage.set("en")).not.toThrow()
    })
})
