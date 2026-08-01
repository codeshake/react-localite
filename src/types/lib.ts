import { CLOSE_DELIMITER, KEY_PATH_SEPARATOR, OPEN_DELIMITER } from "~/constants"
import { LeafDotObjectKeys, LeafDotValueKeys, ValueByNestedKey } from "./object"
import { Split, Trim } from "./string"
import { LookupErrorHandler } from "~/errors"

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
    | ((parameters?: DictionaryPromiseParameters) => Promise<{ default: Dictionary }>)
    | (() => Dictionary)
    | Dictionary

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
    Value,
    Parameters = {},
> = Value extends `${infer _}${typeof OPEN_DELIMITER}${infer Variable}${typeof CLOSE_DELIMITER}${infer Rest}`
    ? DictValueVariables<Rest, Parameters & Record<Trim<Variable>, string>>
    : Parameters

type DictParametersToArray<Value> = keyof Value extends never ? [] : [Value]

export type ContextStore<T extends Translations, D extends Dictionary = DictionaryUnwrap<T[keyof T]>> = <
    GKey extends LeafDotObjectKeys<D> | undefined = undefined,
    Dict extends Dictionary = GKey extends LeafDotObjectKeys<D>
        ? ValueByNestedKey<Split<GKey, typeof KEY_PATH_SEPARATOR>, D>
        : D,
>(
    globalKey?: GKey,
) => {
    locale: keyof T
    setLocale: (locale: keyof T) => void
    isLoading: boolean
    t: <TKey extends LeafDotValueKeys<Dict>>(
        key: TKey,
        ...parameters: DictParametersToArray<DictValueVariables<ValueByNestedKey<Split<TKey, typeof KEY_PATH_SEPARATOR>, Dict>>>
    ) => string
}

export type Options<T extends Translations> = {
    fallbackLocale: keyof T
    localeStorage?: LocaleStorage
    onError?: LookupErrorHandler
}
