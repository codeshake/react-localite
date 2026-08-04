export class MissingKeyError extends Error {
    readonly code = "missing_key" as const

    constructor(readonly key: string) {
        super(`Key "${key}" not found in the dict.`)
        this.name = "MissingKeyError"
    }
}

export class KeyResolvesToObjectError extends Error {
    readonly code = "key_resolves_to_object" as const

    constructor(readonly key: string) {
        super(`Key "${key}" resolves to a nested object, not a string.`)
        this.name = "KeyResolvesToObjectError"
    }
}

export class MissingParameterError extends Error {
    readonly code = "missing_parameter" as const

    constructor(
        readonly parameterKey: string,
        readonly template: string,
    ) {
        super(`Variable "${parameterKey}" wasn't found for "${template}"`)
        this.name = "MissingParameterError"
    }
}

export class DictLoadError extends Error {
    readonly code = "dict_load_error" as const

    constructor(cause: unknown) {
        super(`Failed to load dictionary`, { cause })
        this.name = "DictLoadError"
    }
}

export class NoClosingTagError extends Error {
    readonly code = "no_closing_tag" as const

    constructor(readonly tagName: string) {
        super(`Tag "${tagName}" is never closed`)
        this.name = "NoClosingTagError"
    }
}

export type LookupError =
    MissingKeyError | KeyResolvesToObjectError | MissingParameterError | DictLoadError | NoClosingTagError

export type LookupErrorHandler = (error: LookupError) => void
