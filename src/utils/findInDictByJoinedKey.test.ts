import { describe, expect, it, vi } from "vitest"
import { KEY_PATH_SEPARATOR } from "~/constants"
import { KeyResolvesToObjectError, MissingKeyError } from "~/errors"
import type { Dictionary } from "~/types/lib"
import { findInDictByJoinedKey } from "./findInDictByJoinedKey"

describe("findInDictByJoinedKey", () => {
    it("returns value by top-level key", () => {
        const onError = vi.fn()

        const dict: Dictionary = {
            hello: "world",
        }

        const result = findInDictByJoinedKey(dict, "hello", onError)

        expect(result).toBe("world")
        expect(onError).not.toHaveBeenCalled()
    })

    it("returns value by nested key", () => {
        const onError = vi.fn()

        const dict: Dictionary = {
            home: {
                title: "Home",
            },
        }

        const result = findInDictByJoinedKey(dict, `home${KEY_PATH_SEPARATOR}title`, onError)

        expect(result).toBe("Home")
        expect(onError).not.toHaveBeenCalled()
    })

    it("returns key and reports MissingKeyError when top-level key is missing", () => {
        const onError = vi.fn()

        const dict: Dictionary = {}

        const result = findInDictByJoinedKey(dict, "missing", onError)

        expect(result).toBe("missing")
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0]![0]).toBeInstanceOf(MissingKeyError)
    })

    it("returns key and reports MissingKeyError when nested key is missing", () => {
        const onError = vi.fn()

        const dict: Dictionary = {
            home: {},
        }

        const key = `home${KEY_PATH_SEPARATOR}title`

        const result = findInDictByJoinedKey(dict, key, onError)

        expect(result).toBe(key)
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0]![0]).toBeInstanceOf(MissingKeyError)
    })

    it("returns key and reports MissingKeyError when trying to traverse through a string", () => {
        const onError = vi.fn()

        const dict: Dictionary = {
            home: "Home",
        }

        const key = `home${KEY_PATH_SEPARATOR}title`

        const result = findInDictByJoinedKey(dict, key, onError)

        expect(result).toBe(key)
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0]![0]).toBeInstanceOf(MissingKeyError)
    })

    it("returns key and reports KeyResolvesToObjectError when key resolves to an object", () => {
        const onError = vi.fn()

        const dict: Dictionary = {
            home: {
                title: "Home",
            },
        }

        const result = findInDictByJoinedKey(dict, "home", onError)

        expect(result).toBe("home")
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0]![0]).toBeInstanceOf(KeyResolvesToObjectError)
    })
})
