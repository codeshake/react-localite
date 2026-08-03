import { PLACEHOLDER_CLOSE, PLACEHOLDER_OPEN } from "~/constants"
import { LookupErrorHandler, MissingParameterError } from "~/errors"

export const replacePlaceholders = (
    template: string,
    onError: LookupErrorHandler,
    parameters: Record<string, string> = {},
) => {
    let result = template
    let cursor = 0

    while (true) {
        const left = result.indexOf(PLACEHOLDER_OPEN, cursor)

        if (left === -1) break

        const right = result.indexOf(PLACEHOLDER_CLOSE, left + PLACEHOLDER_OPEN.length)

        if (right === -1) break

        const key = result.slice(left + PLACEHOLDER_OPEN.length, right).trim()

        let replacement = parameters[key]

        if (replacement == null) {
            onError(new MissingParameterError(key, template))

            replacement = `${PLACEHOLDER_OPEN}${key}${PLACEHOLDER_CLOSE}`
        }

        result = result.slice(0, left) + replacement + result.slice(right + PLACEHOLDER_CLOSE.length)

        cursor = left + replacement.length
    }

    return result
}
