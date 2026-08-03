import { CLOSE_DELIMITER, OPEN_DELIMITER } from "~/constants"
import { LookupErrorHandler, MissingParameterError } from "~/errors"

export const appendParameters = (
    template: string,
    onError: LookupErrorHandler,
    parameters: Record<string, string> = {},
) => {
    let result = template
    let cursor = 0

    while (true) {
        const left = result.indexOf(OPEN_DELIMITER, cursor)

        if (left === -1) break

        const right = result.indexOf(CLOSE_DELIMITER, left + OPEN_DELIMITER.length)

        if (right === -1) break

        const key = result.slice(left + OPEN_DELIMITER.length, right).trim()

        let replacement = parameters[key]

        if (replacement == null) {
            onError(new MissingParameterError(key, template))

            replacement = `${OPEN_DELIMITER}${key}${CLOSE_DELIMITER}`
        }

        result = result.slice(0, left) + replacement + result.slice(right + CLOSE_DELIMITER.length)

        cursor = left + replacement.length
    }

    return result
}
