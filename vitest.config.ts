import path from "node:path"
import url from "node:url"
import { defineConfig } from "vitest/config"

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
    resolve: {
        alias: {
            src: path.resolve(__dirname, "src"),
        },
        tsconfigPaths: true,
    },
    test: {
        environment: "jsdom",
        globals: true,
        include: ["src/**/*.test.{ts,tsx}"],
    },
})
