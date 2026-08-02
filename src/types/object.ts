export type LeafObjectKeys<T extends object, S extends string> = {
    [K in keyof T & string]: T[K] extends object ? K | `${K}${S}${LeafObjectKeys<T[K], S>}` : never
}[keyof T & string]

export type LeafValueKeys<T extends object, S extends string> = {
    [K in keyof T & string]: T[K] extends object ? `${K}${S}${LeafValueKeys<T[K], S>}` : K
}[keyof T & string]

export type ValueByNestedKey<PathArray extends readonly PropertyKey[], Data> = PathArray extends []
    ? Data
    : PathArray extends [infer Key, ...infer Rest]
      ? Key extends keyof Data
          ? Rest extends readonly PropertyKey[]
              ? ValueByNestedKey<Rest, Data[Key]>
              : never
          : never
      : never
