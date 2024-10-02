import autoprefixer from "autoprefixer";
import * as esbuild from "esbuild";
import esbuildPluginTsc from "esbuild-plugin-tsc";
import { sassPlugin } from "esbuild-sass-plugin";
import postcss from "postcss";
import postcssPresetEnv from "postcss-preset-env";
import { argv } from "process";

/**
 *
 * @type {esbuild.BuildOptions}
 */
const config = {
    entryPoints: ["./src/index.ts", "./src/styles/*.scss"],
    outdir: "dist",

    platform: "browser",
    bundle: true,
    splitting: true,
    format: "esm",

    plugins: [
        esbuildPluginTsc({
            force: true,
        }),
        sassPlugin({
            async transform(source, resolveDir, filePath) {
                const { css } = await postcss([
                    autoprefixer,
                    postcssPresetEnv({ stage: 0 }),
                ]).process(source, { from: filePath });

                return css;
            }
        })
    ],
}

if (argv.includes("--watch")) {
    (
        await esbuild.context({
            ...config,
            define: {
                "import.meta.env.DEV": "true",
                "import.meta.env.PROD": "false"
            }
        })
    ).watch();
} else {
    await esbuild.build({
        ...config,
        minify: true,
        define: {
            "import.meta.env.DEV": "false",
            "import.meta.env.PROD": "true",
        }
    })
}
