import { build } from "esbuild";
import path from "node:path";
import fs from "node:fs";
import { system } from "lib/system";

const fsp = fs.promises;

async function main() {
  await build({
    entryPoints: [path.join("src", "index.ts")],
    outfile: path.join("dist", "hmtool.js"),
    external: [
      "path",
      "events",
      "stream",
      "fs",
      "node:fs",
      "node:path",
      "util",
      "url",
      "os",
      "string_decoder",
      "node:child_process",
      "node:os",
    ],
    bundle: true,
    minify: true,
  });

  await system("node", ["--experimental-sea-config", "sea-config.json"]);
  await fsp.copyFile(process.execPath, path.join("dist", "hmtool.exe"));

  const postjectConfig = JSON.parse(
    await fsp.readFile(require.resolve("postject/package.json"), "utf-8"),
  );

  await system("node", [
    path.join(
      path.dirname(require.resolve("postject/package.json")),
      postjectConfig.bin.postject,
    ),
    path.join("dist", "hmtool.exe"),
    "NODE_SEA_BLOB",
    path.join("build", "hmtool.blob"),
    "--sentinel-fuse",
    "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
