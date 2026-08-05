import { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import { MissingParameterError, NoClosingTagError } from "~/errors"
import { renderTemplate } from "./renderTemplate"

describe("renderTemplate", () => {
    describe("{{ variables }}", () => {
        it("replaces a single parameter", () => {
            const onError = vi.fn()

            const result = renderTemplate(`Hello {{name}}!`, onError, {
                name: "John",
            })

            expect(result).toBe("Hello John!")
            expect(onError).not.toHaveBeenCalled()
        })

        it("replaces multiple parameters", () => {
            const onError = vi.fn()

            const result = renderTemplate(`{{greeting}}, {{name}}!`, onError, {
                greeting: "Hi",
                name: "Alice",
            })

            expect(result).toBe("Hi, Alice!")
            expect(onError).not.toHaveBeenCalled()
        })

        it("trims whitespace around parameter names", () => {
            const onError = vi.fn()

            const result = renderTemplate(`Hello {{  name   }}!`, onError, {
                name: "John",
            })

            expect(result).toBe("Hello John!")
            expect(onError).not.toHaveBeenCalled()
        })

        it("calls onError and leaves placeholder unchanged when parameter is missing", () => {
            const onError = vi.fn()

            const template = `Hello {{name}}!`

            const result = renderTemplate(template, onError)

            expect(result).toBe("Hello name!")

            expect(onError).toHaveBeenCalledTimes(1)

            const error = onError.mock.calls[0]![0] as MissingParameterError

            expect(error).toBeInstanceOf(MissingParameterError)
        })

        it("calls onError for every missing parameter", () => {
            const onError = vi.fn()

            const template = `{{first}} {{second}}`

            const result = renderTemplate(template, onError)

            expect(result).toBe("first second")
            expect(onError).toHaveBeenCalledTimes(2)
        })

        it("supports repeated parameters", () => {
            const onError = vi.fn()

            const result = renderTemplate(`{{name}} {{name}}`, onError, { name: "John" })

            expect(result).toBe("John John")
            expect(onError).not.toHaveBeenCalled()
        })

        it("returns template unchanged if there are no placeholders", () => {
            const onError = vi.fn()

            const result = renderTemplate("Hello world", onError, {
                name: "John",
            })

            expect(result).toBe("Hello world")
            expect(onError).not.toHaveBeenCalled()
        })

        it("ignores an unclosed placeholder", () => {
            const onError = vi.fn()

            const template = `Hello {{name`

            const result = renderTemplate(template, onError, {
                name: "John",
            })

            expect(result).toBe(template)
            expect(onError).not.toHaveBeenCalled()
        })

        it("uses replacement values containing placeholders without resolving them again", () => {
            const onError = vi.fn()

            const result = renderTemplate(`{{a}}`, onError, {
                a: `{{b}}`,
                b: "value",
            })

            expect(result).toBe(`{{b}}`)
            expect(onError).not.toHaveBeenCalled()
        })
    })

    describe("<tags>", () => {
        it("returns plain text when there are no tags", () => {
            const onError = vi.fn()

            const result = renderTemplate("Hello world", onError)

            expect(result).toEqual("Hello world")
            expect(onError).not.toHaveBeenCalled()
        })

        it("replaces a single tag", () => {
            const onError = vi.fn()

            const result = renderTemplate("Hello <b>world</b>!", onError, {
                b: content => <strong>{content}</strong>,
            })

            expect(result).toEqual(["Hello ", <strong key="1">world</strong>, "!"])
            expect(onError).not.toHaveBeenCalled()
        })

        it("replaces a nested tag", () => {
            const onError = vi.fn()

            const result = renderTemplate("Hello <b><b>simple</b> world</b>!", onError, {
                b: content => <strong>{content}</strong>,
            })

            expect(result).toEqual([
                "Hello ",
                <strong key="1">
                    <strong key="0">simple</strong> world
                </strong>,
                "!",
            ])
            expect(onError).not.toHaveBeenCalled()
        })

        it("replaces multiple tags", () => {
            const onError = vi.fn()

            const result = renderTemplate("<b>Hello</b> <i>world</i>", onError, {
                b: content => <b>{content}</b>,
                i: content => <i>{content}</i>,
            })

            expect(result).toEqual([<b key="0">Hello</b>, " ", <i key="2">world</i>])
            expect(onError).not.toHaveBeenCalled()
        })

        it("passes tag content to renderer", () => {
            const onError = vi.fn()
            const renderer = vi.fn((content: ReactNode): ReactNode => {
                return typeof content === "string" ? content.toUpperCase() : content
            })

            void renderTemplate("<tag>hello</tag>", onError, {
                tag: renderer,
            })

            expect(renderer).toHaveBeenCalledWith("hello")
            expect(onError).not.toHaveBeenCalled()
        })

        it("calls onError for unknown tag and keeps original text", () => {
            const onError = vi.fn()

            const template = "Hello <unknown>world</unknown>!"

            const result = renderTemplate(template, onError)

            expect(result).toEqual("Hello world!")

            expect(onError).toHaveBeenCalledTimes(1)

            expect(onError.mock.calls[0]![0]).toBeInstanceOf(MissingParameterError)
        })

        it("calls onError and returns original text if opening tag has no closing tag", () => {
            const onError = vi.fn()

            const template = "Hello <b>world"

            const result = renderTemplate(template, onError, {
                b: content => content,
            })

            expect(result).toEqual(template)
            expect(onError.mock.calls[0]![0]).toBeInstanceOf(NoClosingTagError)
        })

        it("returns original text if opening bracket is not closed", () => {
            const onError = vi.fn()

            const template = "Hello <b world"

            const result = renderTemplate(template, onError)

            expect(result).toEqual(template)
            expect(onError).not.toHaveBeenCalled()
        })

        it("keeps standalone closing tag unchanged", () => {
            const onError = vi.fn()

            const template = "Hello </b> world"

            const result = renderTemplate(template, onError)

            expect(result).toEqual(template)
            expect(onError).not.toHaveBeenCalled()
        })

        it("supports empty tag content", () => {
            const onError = vi.fn()

            const result = renderTemplate("<b></b>", onError, {
                b: content => (typeof content === "string" ? `[${content}]` : content),
            })

            expect(result).toEqual("[]")
            expect(onError).not.toHaveBeenCalled()
        })

        it("ignore whitespaces around tag name", () => {
            const onError = vi.fn()

            const result = renderTemplate("<  b  >text</b>", onError, {
                b: content => content,
            })

            expect(result).toEqual("<  b  >text</b>")
            expect(onError).not.toHaveBeenCalled()
        })
    })
})
