import { useCallback, useEffect, useState } from "react"
import { DictLoadError, LookupErrorHandler } from "~/errors"
import { Dictionary, DictionaryLoadItem } from "~/types/lib"

const dictCache = new WeakMap<DictionaryLoadItem, Dictionary>()

const getResourceData = async (
    resource: DictionaryLoadItem,
    abortController?: AbortController,
): Promise<Dictionary> => {
    if (typeof resource === "function") {
        const result = resource({ abortController })

        if (result instanceof Promise) {
            const { default: promiseResult } = await result

            return promiseResult
        }

        return result
    }

    return resource
}

export const useDictionary = (
    dictionaryLoader: DictionaryLoadItem,
    onError: LookupErrorHandler,
    initialDictState?: Dictionary,
) => {
    const [isLoading, setIsLoading] = useState(false)

    const [dict, setDict] = useState<Dictionary | undefined>(() => {
        return dictCache.get(dictionaryLoader) ?? initialDictState
    })

    const load = useCallback(
        async (abortController: AbortController) => {
            setIsLoading(true)

            try {
                const resourceData = await getResourceData(dictionaryLoader, abortController)

                dictCache.set(dictionaryLoader, resourceData)

                setDict(resourceData)
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return
                }

                onError(new DictLoadError(error))
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false)
                }
            }
        },
        [dictionaryLoader, onError],
    )

    useEffect(() => {
        if (dictCache.has(dictionaryLoader)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDict(dictCache.get(dictionaryLoader))

            return
        }

        const abortController = new AbortController()

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        load(abortController)

        return () => {
            abortController.abort()
        }
    }, [dictionaryLoader, load])

    return { dict, isLoading }
}
