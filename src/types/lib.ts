/* eslint-disable unicorn/name-replacements */
import { ReactNode } from "react"
import {
    CLOSING_TAG_PREFIX,
    KEY_PATH_SEPARATOR,
    PLACEHOLDER_CLOSE,
    PLACEHOLDER_OPEN,
    TAG_END,
    TAG_START,
} from "~/constants"
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

export type DictionaryParameter = ((content: ReactNode) => ReactNode) | ReactNode

export type DictionaryParameters = Record<string, DictionaryParameter>

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
> = Value extends `${infer _}${typeof PLACEHOLDER_OPEN}${infer Variable}${typeof PLACEHOLDER_CLOSE}${infer Rest}`
    ? DictValueVariables<Rest, Parameters & Record<Trim<Variable>, DictionaryParameter>>
    : Value extends `${infer _}${typeof TAG_START}${infer Variable}${typeof TAG_END}${infer _}${typeof TAG_START}${typeof CLOSING_TAG_PREFIX}${infer Variable}${typeof TAG_END}${infer Rest}`
      ? DictValueVariables<Rest, Parameters & Record<Trim<Variable>, DictionaryParameter>>
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
                ? [DictionaryParameters?]
                : DictParametersToArray<DictValueVariables<TValue>>
            : []
    ) => ReactNode
}

export type Options<T extends Translations> = {
    fallbackLocale: keyof T
    localeStorage?: LocaleStorage
    onError?: LookupErrorHandler
}
