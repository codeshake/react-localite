export type Split<Value extends string, Delimiter extends string> = string extends Value
    ? string[]
    : Value extends ""
      ? []
      : Value extends `${infer T}${Delimiter}${infer U}`
        ? [T, ...Split<U, Delimiter>]
        : [Value]

type Whitespace = " " | "\n" | "\t" | "\r"

type TrimLeft<S extends string> = S extends `${Whitespace}${infer Rest}` ? TrimLeft<Rest> : S

type TrimRight<S extends string> = S extends `${infer Rest}${Whitespace}` ? TrimRight<Rest> : S

export type Trim<S extends string> = TrimLeft<TrimRight<S>>
