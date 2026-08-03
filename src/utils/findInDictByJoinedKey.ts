import { KEY_PATH_SEPARATOR } from "~/constants"
import { KeyResolvesToObjectError, LookupErrorHandler, MissingKeyError } from "~/errors"
import { Dictionary } from "~/types/lib"

export const findInDictByJoinedKey = (dict: Dictionary, key: string, onError: LookupErrorHandler) => {
    const keyParts = key.split(KEY_PATH_SEPARATOR)
    let currentLevel: string | Dictionary | undefined = dict

    for (const part of keyParts) {
        if (typeof currentLevel !== "object" || !Object.hasOwn(currentLevel, part)) {
            onError(new MissingKeyError(key))

            return key
        }

        currentLevel = currentLevel[part]
    }

    if (typeof currentLevel !== "string") {
        onError(new KeyResolvesToObjectError(key))

        return key
    }

    return currentLevel
}
