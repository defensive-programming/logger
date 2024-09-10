import * as dnt from "@deno/dnt";
import denoJSON from './../deno.json' with { type: "json" };
import packageJSON from './../package.json' with { type: "json" };
import * as U from '@es-toolkit/es-toolkit';
import { exists } from "https://deno.land/std/fs/mod.ts";

const removeNodeModulesFolderIfExists = async () => {
  if (await exists("node_modules")) {
    await Deno.remove("node_modules", { recursive: true });
  }
}

const metadata = {
  name: denoJSON.name,
  version: denoJSON.version,
  ...U.omit(packageJSON, ['scripts', 'devDependencies'])
}

await dnt.emptyDir("./npm");

await dnt.build({
  test: false, // @20240830
  entryPoints: ["./src/index.ts"],
  outDir: "./npm",
  shims: {
    deno: true, // so if you've used Deno-specific APIs, they will be transformed into Node.js APIs during the build
  }, // @ts-ignore: HACK:
  compilerOptions: {
    lib: ['DOM.Iterable', 'DOM']
  },
  importMap: "./deno.json", // https://github.com/denoland/dnt/issues/260
  package: metadata,
  postBuild() {
    // steps to run after building and before running the tests
    // Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("readme.md", "npm/README.md");

    // Create or modify the .npmignore file
    const npmignoreContent = `
      package-lock.json
    `;
    Deno.writeTextFileSync("npm/.npmignore", npmignoreContent.trim());
    /**
     * @20240830 HACK:
     * Currently, it seems that there's a bug as described below:
     * - `deno task launch`
     * - during the execution of `deno task build`, there's a node_modules will be created in the root folder
     * - that node_modules will finally cause the failed build
     * - but if you remove that node_modules and run  `deno task build` solely, it will be successful.
     *
     * It seems like the root cause is not really just the generated node_modules
     * (which shouldn't be generated), but the setting `test` in dnt configuration.
     *
     * Turn it off can make build successful.
     *
     * Note that, it seems like some npm packages can cause deno to generate node_modules,
     * (https://github.com/denoland/deno/issues/17930)
     * and there's an option that can force that to be generated, which has been used in deno.json: `nodeModulesDir`
     */
    return removeNodeModulesFolderIfExists(); // Return the promise
  },
});