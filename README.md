# React Localite

[![CI][ci-badge]][ci-url]
[![Size][size-badge]][size-url]
[![Quality][quality-badge]][quality-url]
[![npm][npm-dl-badge]][npm-url]

[ci-badge]: https://github.com/codeshake/react-localite/actions/workflows/release.yaml/badge.svg
[ci-url]: https://github.com/codeshake/react-localite/actions/workflows/release.yaml
[npm-url]: https://npmjs.org/package/react-localite
[npm-dl-badge]: https://img.shields.io/npm/dw/react-localite
[quality-badge]: https://npm.packagequality.com/shield/react-localite.svg
[quality-url]: https://packagequality.com/#?package=react-localite
[size-badge]: https://deno.bundlejs.com/badge?q=react-localite@latest&config={%22esbuild%22:{%22external%22:[%22react%22,%22react-dom%22]}}
[size-url]: https://bundlejs.com/?q=react-localite@latest&config={%22esbuild%22:{%22external%22:[%22react%22,%22react-dom%22]}}

A lightweight, fully type-safe React internationalization library with lazy-loaded dictionaries and zero runtime key typing.

## Features

- Full TypeScript autocomplete for translation keys
- Nested translation dictionaries
- Lazy-loaded dictionaries with caching
- Placeholder and tags interpolation
- React Context based
- Fallback locale support
- Persistent locale storage
- Strongly typed translation parameters
- Global dictionary scopes

---

## Installation

```bash
# npm
npm install react-localite

# yarn
yarn add react-localite

# pnpm
pnpm add react-localite
```

---

## Create translations

```ts
import { initTranslations } from "react-localite"

const { TranslationProvider, useTranslation } = initTranslations(
    {
        en: {
            home: {
                title: "Home",
                description: "Welcome",
            },
        },
        ru: () => import("./locales/ru"),
        fr: () => fetch("https://api.somesite.com/locales/fr"),
    },
    {
        fallbackLocale: "en",
    },
)
```

---

## Provider

Wrap your application.

```tsx
<TranslationProvider>
    <App />
</TranslationProvider>
```

---

## Usage

Translation keys are fully inferred from your dictionary.
To avoid repeating long prefixes, use a global key.

```tsx
function Home() {
    const { t } = useTranslation("home")

    return (
        <>
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
        </>
    )
}
```

---

## Interpolation

Dictionary:

```ts
export default {
    welcome: "Hello, {{ firstName }} {{ lastName }}!",
    profile: "Please visit your <link>profile page</link>",
}
```

Usage:

```tsx
t("welcome", {
    firstName: "John",
    lastName: "Doe",
})

t("profile", {
    link: content => <a href="/profile">{content}</a>,
})
```

Parameters are inferred automatically from the translation string.

---

## API

### `initTranslations(translations, options)`

### translations

Translation sources keyed by locale. Each locale can provide translations as a static object, a lazy loader, or an async function that fetches translations.

### options

| Option                      | Description                                                                                                                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fallbackLocale` (required) | Locale to use when the requested locale is unavailable.                                                                                                                                                                       |
| `localeStorage`             | Controls how the selected locale is persisted. Defaults to `getLocaleLocalStorage("local")`. You can provide your own implementation (f.e., a cookie-based solution) as long as it conforms to the `LocaleStorage` interface. |
| `onError`                   | Global error handler. Defaults to `console.error`. You can replace it with your own error reporting function, such as `datadog.addError`, `Sentry.captureException`, or any other compatible handler.                         |

---

## `useTranslation(globalKey?: string)`

### Arguments

| Option      | Description                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `globalKey` | A path to a section of the translation dictionary. All translation keys passed to `t()` will be resolved relative to this path, allowing you to avoid repeating common prefixes. |

### Returns:

| Variable                                                                                       | Description                                                                                                                                        |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `locale`                                                                                       | The currently active locale.                                                                                                                       |
| `setLocale(nextLocale: string)`                                                                | Sets the active locale.                                                                                                                            |
| `isLoading`                                                                                    | Indicates whether translations for the current locale are being loaded asynchronously. Use this to display a loading state in your UI.             |
| `t(key: string, variables?: Record<string, ReactNode \| ((content: ReactNode) => ReactNode>))` | Returns the translated string for the given key. If the translation contains variables, they are replaced with the values provided in `variables`. |

---

## Initial SSR state

To avoid loading dictionaries on the first render:

```tsx
<TranslationProvider
    initialState={{
        locale: "en",
        dict: dictionary,
    }}
>
    <App />
</TranslationProvider>
```
