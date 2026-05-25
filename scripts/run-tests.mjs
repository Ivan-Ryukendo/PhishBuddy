import { spawn } from "node:child_process";

const commands = [
  ["node", ["node_modules/vitest/vitest.mjs", "run"]],
  ["node", ["extension/__tests__/apiClient.test.cjs"]],
  ["node", ["extension/__tests__/ui.test.cjs"]],
];

for (const [command, args] of commands) {
  await run(command, args);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}
