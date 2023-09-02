import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { rimraf } from "rimraf";
import { readConfig } from "lib/config";
import { system } from "lib/system";

const fsp = fs.promises;

export async function registry(args: string[]) {
  const configLocation = args[0] ?? "mods.yaml";
  const config = await readConfig(args[0] ?? "mods.yaml");
  const configDirectory = path.dirname(configLocation);

  const keyName =
    "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Bethesda Softworks\\Skyrim Special Edition";
  const keyName2 = "HKEY_LOCAL_MACHINE\\SOFTWARE\\Bethesda Softworks\\Skyrim Special Edition";
  const valueName = "installed path";

  const ostmp = os.tmpdir();
  let tmpdir: string | null = null;
  try {
    tmpdir = await fsp.mkdtemp(path.join(ostmp, "hmtool-regedit-"));
    console.log(
      `Created temporary directory "${tmpdir}" to store registry edit script`,
    );
    const scriptPath = path.join(tmpdir, "hmtool.reg");
    const scriptContents = [
      "Windows Registry Editor Version 5.00",
      "",
      `[${keyName}]`,
      `"${valueName}"="${path.resolve(configDirectory, config.output).replace(/\\/g, "\\\\")}"`,
      "",
      `[${keyName2}]`,
      `"${valueName}"="${path.resolve(configDirectory, config.output).replace(/\\/g, "\\\\")}"`,
      "",
    ].join("\n");

    await fsp.writeFile(scriptPath, scriptContents);
    await system("start", ["/wait", '""', "regedit.exe", "/s", scriptPath], { shell: true });
  } finally {
    if (tmpdir) {
      await rimraf(tmpdir);
      console.log(`Cleaned up temporary directory "${tmpdir}"`);
    }
  }
}
