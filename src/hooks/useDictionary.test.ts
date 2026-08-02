import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Dictionary } from "~/types/lib"

describe("useDictionary", () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it("loads sync dictionary", async () => {
        const { useDictionary } = await import("./useDictionary")

        const dict: Dictionary = { hello: "world" }

        const loader = vi.fn(() => dict)
        const onError = vi.fn()

        const { result } = renderHook(() => useDictionary(loader, onError))

        expect(result.current.dict).toBeUndefined()
        expect(result.current.isLoading).toBe(true)

        await waitFor(() => {
            expect(result.current.dict).toBe(dict)
        })

        expect(result.current.isLoading).toBe(false)
        expect(onError).not.toHaveBeenCalled()
    })

    it("loads async dictionary", async () => {
        const { useDictionary } = await import("./useDictionary")

        const dict: Dictionary = { hello: "world" }

        const loader = vi.fn(() =>
            Promise.resolve({
                default: dict,
            }),
        )

        const onError = vi.fn()

        const { result } = renderHook(() => useDictionary(loader, onError))

        await waitFor(() => {
            expect(result.current.dict).toBe(dict)
        })

        expect(result.current.isLoading).toBe(false)
    })

    it("uses initial dictionary before loading", async () => {
        const { useDictionary } = await import("./useDictionary")

        const initial = { loading: "..." }
        const loaded = { hello: "world" }

        const loader = vi.fn(() => loaded)
        const onError = vi.fn()

        const { result } = renderHook(() => useDictionary(loader, onError, initial))

        expect(result.current.dict).toBe(initial)

        await waitFor(() => {
            expect(result.current.dict).toBe(loaded)
        })
    })

    it("calls onError when loading fails", async () => {
        const { useDictionary } = await import("./useDictionary")
        const { DictLoadError } = await import("~/errors")

        const error = new Error("boom")

        const loader = vi.fn(() => {
            throw error
        })

        const onError = vi.fn()

        renderHook(() => useDictionary(loader, onError))

        await waitFor(() => {
            expect(onError).toHaveBeenCalledTimes(1)
        })

        expect(onError.mock.calls[0]![0]).toBeInstanceOf(DictLoadError)
    })

    it("ignores AbortError", async () => {
        const { useDictionary } = await import("./useDictionary")

        const loader = vi.fn(() => {
            throw new DOMException("Aborted", "AbortError")
        })

        const onError = vi.fn()

        renderHook(() => useDictionary(loader, onError))

        await waitFor(() => {
            expect(loader).toHaveBeenCalled()
        })

        expect(onError).not.toHaveBeenCalled()
    })

    it("uses cached dictionary on subsequent mounts", async () => {
        const { useDictionary } = await import("./useDictionary")

        const dict = { hello: "world" }

        const loader = vi.fn(() => dict)
        const onError = vi.fn()

        const first = renderHook(() => useDictionary(loader, onError))

        await waitFor(() => {
            expect(first.result.current.dict).toBe(dict)
        })

        first.unmount()

        const second = renderHook(() => useDictionary(loader, onError))

        expect(second.result.current.dict).toBe(dict)
        expect(second.result.current.isLoading).toBe(false)

        // loader был вызван только при первом монтировании
        expect(loader).toHaveBeenCalledTimes(1)
    })

    it("aborts request on unmount", async () => {
        const { useDictionary } = await import("./useDictionary")

        const loader = vi.fn(() => new Promise<{ default: Dictionary }>(() => {}))
        const onError = vi.fn()

        const abortSpy = vi.spyOn(AbortController.prototype, "abort")

        const { unmount } = renderHook(() => useDictionary(loader, onError))

        unmount()

        expect(abortSpy).toHaveBeenCalledOnce()
    })
})
