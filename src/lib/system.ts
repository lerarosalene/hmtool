import { SpawnOptions, spawn } from "node:child_process";

export function system(
  command: string,
  args: string[],
  opts?: Partial<SpawnOptions>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: "inherit",
      ...(opts || {}),
    });
    process.on("exit", (code: number | null) => {
      if (code === 0) {
        return void resolve();
      }

      if (code === null) {
        return void reject(new Error(`Process exited abruptly`));
      }

      reject(new Error(`Process exited with code ${code}`));
    });
  });
}
