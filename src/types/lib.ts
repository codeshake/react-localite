/* eslint-disable unicorn/name-replacements */
import { CLOSE_DELIMITER, KEY_PATH_SEPARATOR, OPEN_DELIMITER } from "~/constants"
import { LookupErrorHandler } from "~/errors"
import { LeafObjectKeys, LeafValueKeys, ValueByNestedKey } from "./object"
import { Split, Trim } from "./string"

export type Locale = string | string[] | undefined

export type LocaleStorage = {
    get: () => Locale
    set: (locale: string) => void
}

export type Dictionary = {
    [key: string]: string | Dictionary
}

export type DictionaryPromiseParameters = {
    abortController?: AbortController
}

export type DictionaryLoadItem =
    ((parameters?: DictionaryPromiseParameters) => Promise<{ default: Dictionary }>) | (() => Dictionary) | Dictionary

type DictionaryUnwrap<T extends DictionaryLoadItem> = T extends Dictionary
    ? T
    : T extends () => Dictionary
      ? ReturnType<T>
      : T extends () => Promise<{ default: infer D }>
        ? D
        : never

export type Translations = Record<string, DictionaryLoadItem>

export type InitialState<T extends Translations> = {
    locale: keyof T
    dict: DictionaryUnwrap<T[keyof T]>
}

type DictValueVariables<
    Value extends string,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Parameters = {},
> = Value extends `${infer _}${typeof OPEN_DELIMITER}${infer Variable}${typeof CLOSE_DELIMITER}${infer Rest}`
    ? DictValueVariables<Rest, Parameters & Record<Trim<Variable>, string>>
    : Parameters

type DictParametersToArray<Value> = keyof Value extends never ? [] : [Value]

export type ContextStore<T extends Translations, D extends Dictionary = DictionaryUnwrap<T[keyof T]>> = <
    GKey extends LeafObjectKeys<D, typeof KEY_PATH_SEPARATOR> | undefined = undefined,
    Dict extends Dictionary = GKey extends LeafObjectKeys<D, typeof KEY_PATH_SEPARATOR>
        ? ValueByNestedKey<Split<GKey, typeof KEY_PATH_SEPARATOR>, D>
        : D,
>(
    globalKey?: GKey,
) => {
    locale: keyof T
    setLocale: (locale: keyof T) => void
    isLoading: boolean
    t: <
        TKey extends LeafValueKeys<Dict, typeof KEY_PATH_SEPARATOR>,
        TValue = ValueByNestedKey<Split<TKey, typeof KEY_PATH_SEPARATOR>, Dict>,
    >(
        key: TKey,
        ...parameters: TValue extends string
            ? string extends TValue
                ? [Record<string, string>?]
                : DictParametersToArray<DictValueVariables<TValue>>
            : []
    ) => string
}

export type Options<T extends Translations> = {
    fallbackLocale: keyof T
    localeStorage?: LocaleStorage
    onError?: LookupErrorHandler
}
