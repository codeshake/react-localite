export type LeafObjectKeys<T extends object, S extends string> = {
    [K in keyof T & string]: T[K] extends object ? K | `${K}${S}${LeafObjectKeys<T[K], S>}` : never
}[keyof T & string]

export type LeafValueKeys<T extends object, S extends string> = {
    [K in keyof T & string]: T[K] extends object ? `${K}${S}${LeafValueKeys<T[K], S>}` : K
}[keyof T & string]

export type ValueByNestedKey<PathArray, Data extends Record<string, unknown>> = PathArray extends [
    infer First,
    ...infer Rest,
]
    ? First extends string
        ? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          Data[First] extends {}
            ? ValueByNestedKey<Rest, Data[First]>
            : Data[First]
        : never
    : Data
