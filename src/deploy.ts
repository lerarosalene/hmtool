import * as fs from "node:fs";
import path from "node:path";
import { rimraf } from "rimraf";
import { isErrnoException } from "lib/isErrnoException";
import { readConfig } from "lib/config";
import { Config } from "lib/schemes";

const fsp = fs.promises;

let collisionCounter = 0;

async function recursiveInstall(from: string, to: string) {
  const stat = await fsp.stat(from);
  const promises: Array<Promise<void>> = [];
  if (stat.isDirectory()) {
    const entries = await fsp.readdir(from);
    for (const entry of entries) {
      const newFrom = path.join(from, entry);
      const newTo = path.join(to, entry);
      promises.push(recursiveInstall(newFrom, newTo));
    }

    await Promise.all(promises);
    return;
  }

  try {
    await fsp.link(from, to);
  } catch (error) {
    const isEEXist = isErrnoException(error) && error.code === "EEXIST";
    const isENOEnt = isErrnoException(error) && error.code === "ENOENT";
    if (isEEXist) {
      collisionCounter += 1;
      await fsp.unlink(to);
      await fsp.link(from, to);
    }
    if (isENOEnt) {
      const destDirname = path.dirname(to);
      await fsp.mkdir(destDirname, { recursive: true });
      await fsp.link(from, to);
    }
    if (!isEEXist && !isENOEnt) {
      throw error;
    }
  }
}

async function installFolders(modsDirectory: string, config: Config) {
  try {
    await rimraf(config.output);
  } catch (error) {}

  const realMods: typeof config["mods"] = [];
  if (config.base) {
    realMods.push({ path: config.base, prefix: "." });
  }
  config.mods.forEach(mod => realMods.push(mod));

  console.log(`[0/${realMods.length}] Previous installation cleaned up`);
  for (let i = 0; i < realMods.length; ++i) {
    const mod = realMods[i];
    const realInstallPath = path.resolve(
      modsDirectory,
      config.output,
      mod.prefix,
    );
    await recursiveInstall(
      path.resolve(modsDirectory, mod.path),
      realInstallPath,
    );
    console.log(`[${i + 1}/${realMods.length}] Installed ${mod.path}`);
  }
}

export async function deploy(args: string[]) {
  const configLocation = args[0] ?? "mods.yaml";
  const config = await readConfig(configLocation);

  const configDirectory = path.dirname(configLocation);
  await installFolders(configDirectory, config);
  console.log(`[info] ${collisionCounter} collisions encountered`);

  if (config.sse?.plugins) {
    if (!process.env.LOCALAPPDATA) {
      throw new Error(`env:LOCALAPPDATA is not defined`);
    }
    const installLocation = path.resolve(
      process.env.LOCALAPPDATA,
      "Skyrim Special Edition",
      "Plugins.txt",
    );
    await fsp.copyFile(
      path.resolve(configDirectory, config.sse.plugins),
      installLocation,
    );
    console.log(
      `Installed plugins file: ${config.sse.plugins} -> ${installLocation}`,
    );
  }
}
