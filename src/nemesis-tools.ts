import path from "node:path";
import fs from "node:fs";
import { glob } from "glob";
import { readConfig } from "lib/config";
import { isErrnoException } from "lib/isErrnoException";
import { rimraf } from "rimraf";

const fsp = fs.promises;

export async function nemesisSnapshot(args: string[]) {
  if (!process.env.LOCALAPPDATA) {
    throw new Error(`env:LOCALAPPDATA is undefined`);
  }

  const configLocation = args[0] ?? "mods.yaml";
  const config = await readConfig(configLocation);
  const configDirectory = path.dirname(configLocation);

  const globWd = path.resolve(configDirectory, config.output, "Data");
  const snapshotDirectory = path.resolve(process.env.LOCALAPPDATA, "hmtool", "nemesis-snapshot");

  const files = await glob(['**/*.hkx', '**/*.txt', '**/*.pex'], { cwd: globWd });
  for (const file of files) {
    const src = path.join(globWd, file);
    const dst = path.join(snapshotDirectory, file);

    try {
      await fsp.copyFile(src, dst);
    } catch (error) {
      const isENOENT = isErrnoException(error) && error.code === "ENOENT";
      if (isENOENT) {
        await fsp.mkdir(path.dirname(dst), { recursive: true });
        await fsp.copyFile(src, dst);
      } else {
        throw error;
      }
    }
  }
}

export async function nemesisPatch(args: string[]) {
  if (!process.env.LOCALAPPDATA) {
    throw new Error(`env:LOCALAPPDATA is undefined`);
  }
  const configLocation = args[0] ?? "mods.yaml";
  const config = await readConfig(configLocation);
  const configDirectory = path.dirname(configLocation);
  if (!config.sse?.nemesis_patch) {
    throw new Error(`Please specify location to store patch in sse.nemesis_patch in config`);
  }

  const globWd = path.resolve(configDirectory, config.output, "Data");
  const snapshotDirectory = path.resolve(process.env.LOCALAPPDATA, "hmtool", "nemesis-snapshot");
  const patchDirectory = path.resolve(configDirectory, config.sse?.nemesis_patch);

  const files = await glob(['**/*.hkx', '**/*.txt', '**/*.pex'], { cwd: globWd });
  for (const file of files) {
    const src = path.join(globWd, file);
    const backup = path.join(snapshotDirectory, file);
    const patch = path.join(patchDirectory, file);

    const srcContents = await fsp.readFile(src);
    let backupContents: null | Buffer = null;
    try {
      backupContents = await fsp.readFile(backup);
    } catch (error) {
      const isENOENT = isErrnoException(error) && error.code === "ENOENT";
      if (!isENOENT) {
        throw error;
      }
    }

    const shouldCreatePatch = !backupContents || !backupContents.equals(srcContents);
    if (shouldCreatePatch) {
      console.log(`Creating patch: ${src}`);
      try {
        await fsp.unlink(patch);
      } catch (error) {
        const isENOENT = isErrnoException(error) && error.code === "ENOENT";
        if (!isENOENT) {
          throw error;
        }
      }
      try {
        await fsp.copyFile(src, patch);
      } catch (error) {
        const isENOENT = isErrnoException(error) && error.code === "ENOENT";
        if (isENOENT) {
          await fsp.mkdir(path.dirname(patch), { recursive: true });
          await fsp.copyFile(src, patch);
        } else {
          throw error;
        }
      }

      if (backupContents) {
        console.log(`Restoring backup: ${src}`);
        const handle = await fsp.open(src, 'w');
        await handle.write(backupContents);
        await handle.close();
      } else {
        console.log(`Removing new file: ${src}`);
        await fsp.unlink(src);
      }
    }
  }

  await rimraf(snapshotDirectory);
}
