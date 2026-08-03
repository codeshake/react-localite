import { describe, expect, it, vi } from "vitest"
import { PLACEHOLDER_CLOSE, PLACEHOLDER_OPEN } from "~/constants"
import { MissingParameterError } from "~/errors"
import { replacePlaceholders } from "./replacePlaceholders"

describe("replacePlaceholders", () => {
    it("replaces a single parameter", () => {
        const onError = vi.fn()

        const result = replacePlaceholders(`Hello ${PLACEHOLDER_OPEN}name${PLACEHOLDER_CLOSE}!`, onError, {
            name: "John",
        })

        expect(result).toBe("Hello John!")
        expect(onError).not.toHaveBeenCalled()
    })

    it("replaces multiple parameters", () => {
        const onError = vi.fn()

        const result = replacePlaceholders(
            `${PLACEHOLDER_OPEN}greeting${PLACEHOLDER_CLOSE}, ${PLACEHOLDER_OPEN}name${PLACEHOLDER_CLOSE}!`,
            onError,
            {
                greeting: "Hi",
                name: "Alice",
            },
        )

        expect(result).toBe("Hi, Alice!")
        expect(onError).not.toHaveBeenCalled()
    })

    it("trims whitespace around parameter names", () => {
        const onError = vi.fn()

        const result = replacePlaceholders(`Hello ${PLACEHOLDER_OPEN}  name   ${PLACEHOLDER_CLOSE}!`, onError, {
            name: "John",
        })

        expect(result).toBe("Hello John!")
        expect(onError).not.toHaveBeenCalled()
    })

    it("calls onError and leaves placeholder unchanged when parameter is missing", () => {
        const onError = vi.fn()

        const template = `Hello ${PLACEHOLDER_OPEN}name${PLACEHOLDER_CLOSE}!`

        const result = replacePlaceholders(template, onError)

        expect(result).toBe(template)

        expect(onError).toHaveBeenCalledTimes(1)

        const error = onError.mock.calls[0]![0] as MissingParameterError

        expect(error).toBeInstanceOf(MissingParameterError)
    })

    it("calls onError for every missing parameter", () => {
        const onError = vi.fn()

        const template = `${PLACEHOLDER_OPEN}first${PLACEHOLDER_CLOSE} ${PLACEHOLDER_OPEN}second${PLACEHOLDER_CLOSE}`

        const result = replacePlaceholders(template, onError)

        expect(result).toBe(template)
        expect(onError).toHaveBeenCalledTimes(2)
    })

    it("supports repeated parameters", () => {
        const onError = vi.fn()

        const result = replacePlaceholders(
            `${PLACEHOLDER_OPEN}name${PLACEHOLDER_CLOSE} ${PLACEHOLDER_OPEN}name${PLACEHOLDER_CLOSE}`,
            onError,
            { name: "John" },
        )

        expect(result).toBe("John John")
        expect(onError).not.toHaveBeenCalled()
    })

    it("returns template unchanged if there are no placeholders", () => {
        const onError = vi.fn()

        const result = replacePlaceholders("Hello world", onError, {
            name: "John",
        })

        expect(result).toBe("Hello world")
        expect(onError).not.toHaveBeenCalled()
    })

    it("ignores an unclosed placeholder", () => {
        const onError = vi.fn()

        const template = `Hello ${PLACEHOLDER_OPEN}name`

        const result = replacePlaceholders(template, onError, {
            name: "John",
        })

        expect(result).toBe(template)
        expect(onError).not.toHaveBeenCalled()
    })

    it("uses replacement values containing placeholders without resolving them again", () => {
        const onError = vi.fn()

        const result = replacePlaceholders(`${PLACEHOLDER_OPEN}a${PLACEHOLDER_CLOSE}`, onError, {
            a: `${PLACEHOLDER_OPEN}b${PLACEHOLDER_CLOSE}`,
            b: "value",
        })

        expect(result).toBe(`${PLACEHOLDER_OPEN}b${PLACEHOLDER_CLOSE}`)
        expect(onError).not.toHaveBeenCalled()
    })
})
