export type LeafDotObjectKeys<T extends object, S extends string = ""> = {
    [K in keyof T & string]: T[K] extends object ? K | `${K}${S}${LeafDotObjectKeys<T[K], S>}` : never
}[keyof T & string]

export type LeafDotValueKeys<T extends object, S extends string = ""> = {
    [K in keyof T & string]: T[K] extends object ? `${K}${S}${LeafDotValueKeys<T[K], S>}` : K
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
