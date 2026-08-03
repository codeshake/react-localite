import { describe, expect, it, vi } from "vitest"
import { CLOSE_DELIMITER, OPEN_DELIMITER } from "~/constants"
import { MissingParameterError } from "~/errors"
import { appendParameters } from "./appendParameters"

describe("appendParameters", () => {
    it("replaces a single parameter", () => {
        const onError = vi.fn()

        const result = appendParameters(`Hello ${OPEN_DELIMITER}name${CLOSE_DELIMITER}!`, onError, { name: "John" })

        expect(result).toBe("Hello John!")
        expect(onError).not.toHaveBeenCalled()
    })

    it("replaces multiple parameters", () => {
        const onError = vi.fn()

        const result = appendParameters(
            `${OPEN_DELIMITER}greeting${CLOSE_DELIMITER}, ${OPEN_DELIMITER}name${CLOSE_DELIMITER}!`,
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

        const result = appendParameters(`Hello ${OPEN_DELIMITER}  name   ${CLOSE_DELIMITER}!`, onError, {
            name: "John",
        })

        expect(result).toBe("Hello John!")
        expect(onError).not.toHaveBeenCalled()
    })

    it("calls onError and leaves placeholder unchanged when parameter is missing", () => {
        const onError = vi.fn()

        const template = `Hello ${OPEN_DELIMITER}name${CLOSE_DELIMITER}!`

        const result = appendParameters(template, onError)

        expect(result).toBe(template)

        expect(onError).toHaveBeenCalledTimes(1)

        const error = onError.mock.calls[0]![0] as MissingParameterError

        expect(error).toBeInstanceOf(MissingParameterError)
    })

    it("calls onError for every missing parameter", () => {
        const onError = vi.fn()

        const template = `${OPEN_DELIMITER}first${CLOSE_DELIMITER} ${OPEN_DELIMITER}second${CLOSE_DELIMITER}`

        const result = appendParameters(template, onError)

        expect(result).toBe(template)
        expect(onError).toHaveBeenCalledTimes(2)
    })

    it("supports repeated parameters", () => {
        const onError = vi.fn()

        const result = appendParameters(
            `${OPEN_DELIMITER}name${CLOSE_DELIMITER} ${OPEN_DELIMITER}name${CLOSE_DELIMITER}`,
            onError,
            { name: "John" },
        )

        expect(result).toBe("John John")
        expect(onError).not.toHaveBeenCalled()
    })

    it("returns template unchanged if there are no placeholders", () => {
        const onError = vi.fn()

        const result = appendParameters("Hello world", onError, {
            name: "John",
        })

        expect(result).toBe("Hello world")
        expect(onError).not.toHaveBeenCalled()
    })

    it("ignores an unclosed placeholder", () => {
        const onError = vi.fn()

        const template = `Hello ${OPEN_DELIMITER}name`

        const result = appendParameters(template, onError, {
            name: "John",
        })

        expect(result).toBe(template)
        expect(onError).not.toHaveBeenCalled()
    })

    it("uses replacement values containing placeholders without resolving them again", () => {
        const onError = vi.fn()

        const result = appendParameters(`${OPEN_DELIMITER}a${CLOSE_DELIMITER}`, onError, {
            a: `${OPEN_DELIMITER}b${CLOSE_DELIMITER}`,
            b: "value",
        })

        expect(result).toBe(`${OPEN_DELIMITER}b${CLOSE_DELIMITER}`)
        expect(onError).not.toHaveBeenCalled()
    })
})
