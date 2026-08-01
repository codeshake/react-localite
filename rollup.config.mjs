import { exec } from "node:child_process"
import typescript from "rollup-plugin-typescript2"
import packageJson from "./package.json" with { type: "json" }
import tsConfigJson from "./tsconfig.json" with { type: "json" }

const tsAliasPlugin = () => ({
    name: "tsAlias",
    writeBundle: () => {
        return new Promise((resolve, reject) => {
            // eslint-disable-next-line sonarjs/no-os-command-from-path
            exec("tsc-alias", (error, stdout, stderr) => {
                if (stderr) {
                    reject(new Error(stderr))
                } else if (error) {
                    reject(error)
                } else {
                    resolve(stdout)
                }
            })
        })
    },
})

const externalPackages = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
])

const externalPackagesExpression = new RegExp(`^(${[...externalPackages].join("|")})([:/].+)?$`)

const getOutput = (type, extension) => ({
    dir: tsConfigJson.compilerOptions.outDir,
    entryFileNames: `[name].${extension}`,
    exports: "named",
    format: type,
    sourcemap: true,
})

export default {
    cache: false,
    external: (moduleId, _parentId, isResolved) => !isResolved && externalPackagesExpression.test(moduleId),
    input: "src/index.ts",
    output: [getOutput("cjs", "cjs"), getOutput("esm", "mjs")],
    plugins: [
        typescript({
            exclude: ["node_modules"],
            useTsconfigDeclarationDir: true,
        }),
        tsAliasPlugin(),
    ],
}
