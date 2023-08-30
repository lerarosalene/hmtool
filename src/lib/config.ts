import fs from "node:fs";
import yaml from "yaml";
import { Config, config } from "./schemes";

const fsp = fs.promises;

export async function readConfig(path: string): Promise<Config> {
  const raw = await fsp.readFile(path, "utf-8");
  const data = yaml.parse(raw);
  return config.parse(data);
}
