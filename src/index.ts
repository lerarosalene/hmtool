import { deploy } from "./deploy";
import { nemesisPatch, nemesisSnapshot } from "./nemesis-tools";
import { registry } from "./registry";

type Tool = (args: string[]) => Promise<void>;
const tools: Partial<Record<string, Tool>> = {
  deploy: deploy,
  registry: registry,
  "nemesis-snapshot": nemesisSnapshot,
  "nemesis-patch": nemesisPatch,
};

async function main() {
  const [toolName, ...args] = process.argv.slice(2);
  if (!toolName) {
    // TODO: usage
    return;
  }

  const tool = tools[toolName];
  if (!tool) {
    // TOOD: usage
    throw new Error(`Unknown tool: ${toolName}`);
  }

  return await tool(args);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
