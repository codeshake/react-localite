/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable sonarjs/no-primitive-wrappers */
/// <reference types="@total-typescript/ts-reset" />

interface BooleanConstructor {
    new (value?: unknown): Boolean
    <T>(value?: T): value is TSReset.NonFalsy<T>
    readonly prototype: Boolean
}
