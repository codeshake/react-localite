import { ReactNode } from "react"
import { CLOSING_TAG_PREFIX, PLACEHOLDER_CLOSE, PLACEHOLDER_OPEN, TAG_END, TAG_START } from "~/constants"
import { LookupErrorHandler, MissingParameterError, NoClosingTagError } from "~/errors"
import { DictionaryParameters } from "~/types/lib"

type TemplateNode =
    | { kind: "text"; value: string }
    | { kind: "variable"; name: string }
    | { kind: "tag"; name: string; children: TemplateNode[] }

const VARIABLE_RE = new RegExp(String.raw`${PLACEHOLDER_OPEN}\s*([a-zA-Z_]\w*)\s*${PLACEHOLDER_CLOSE}`, "y")
const TAG_OPEN_RE = new RegExp(String.raw`${TAG_START}([a-zA-Z_]\w*)${TAG_END}`, "y")

const findMatchingClose = (input: string, fromIndex: number, tagName: string): number => {
    const openTag = `${TAG_START}${tagName}${TAG_END}`
    const closeTag = `${TAG_START}${CLOSING_TAG_PREFIX}${tagName}${TAG_END}`

    let depth = 1
    let index = fromIndex

    while (index < input.length) {
        if (input.startsWith(openTag, index)) {
            depth += 1
            index += openTag.length
        } else if (input.startsWith(closeTag, index)) {
            depth -= 1
            if (depth === 0) return index
            index += closeTag.length
        } else {
            index += 1
        }
    }

    return -1
}

const parseTemplate = (input: string, onError: LookupErrorHandler): TemplateNode[] => {
    const nodes: TemplateNode[] = []

    let text = ""
    let index = 0

    const flushText = () => {
        if (!text) return

        nodes.push({ kind: "text", value: text })
        text = ""
    }

    while (index < input.length) {
        VARIABLE_RE.lastIndex = index

        const variableMatch = VARIABLE_RE.exec(input)

        if (variableMatch && variableMatch[0] && variableMatch[1]) {
            flushText()
            nodes.push({ kind: "variable", name: variableMatch[1].trim() })
            index += variableMatch[0].length
            continue
        }

        TAG_OPEN_RE.lastIndex = index

        const openMatch = TAG_OPEN_RE.exec(input)

        if (openMatch && openMatch[0] && openMatch[1]) {
            const tagName = openMatch[1].trim()
            const contentStart = index + openMatch[0].length
            const closeIndex = findMatchingClose(input, contentStart, tagName)

            if (closeIndex === -1) {
                onError(new NoClosingTagError(tagName))
                text += input[index]
                index += 1
                continue
            }

            flushText()
            const children = parseTemplate(input.slice(contentStart, closeIndex), onError)
            nodes.push({ kind: "tag", name: tagName, children })
            index = closeIndex + `${TAG_START}${CLOSING_TAG_PREFIX}${tagName}${TAG_END}`.length
            continue
        }

        text += input[index]
        index += 1
    }

    flushText()

    return nodes
}

const renderNode = (
    template: string,
    node: TemplateNode,
    parameters: DictionaryParameters,
    onError: LookupErrorHandler,
): ReactNode => {
    if (node.kind === "text") {
        return node.value
    }

    if (node.kind === "variable") {
        const parameter = parameters[node.name]

        if (parameter == null) {
            onError(new MissingParameterError(node.name, template))

            return node.name
        }

        if (typeof parameter === "function") {
            return parameter(null)
        }

        return parameter
    }

    if (node.kind === "tag") {
        const parameter = parameters[node.name]
        const content = renderNodes(template, node.children, parameters, onError)

        if (parameter == null) {
            onError(new MissingParameterError(node.name, template))

            return content
        }

        if (typeof parameter === "function") {
            return parameter(content)
        }

        return parameter
    }

    return null
}

const isPrimitive = (value: unknown) => value !== Object(value)

const renderNodes = (
    template: string,
    tree: TemplateNode[],
    parameters: DictionaryParameters,
    onError: LookupErrorHandler,
): ReactNode => {
    const rendered = tree.map(node => renderNode(template, node, parameters, onError))

    if (rendered.length === 1) return rendered[0]

    if (rendered.every(part => isPrimitive(part))) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return rendered.join("")
    }

    return rendered
}

export const renderTemplate = (
    template: string,
    onError: LookupErrorHandler,
    parameters: DictionaryParameters = {},
) => {
    const tree = parseTemplate(template, onError)

    return renderNodes(template, tree, parameters, onError)
}
