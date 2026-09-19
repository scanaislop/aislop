import { spawn } from "child_process";
import { detect } from "package-manager-detector";
import { resolveCommand } from "package-manager-detector/commands";
async function runFormatterCommand({ args, command }, { cwd, patterns }) {
  return await spawnFormatterCommand(
    { args: [...args, ...patterns], command },
    cwd
  );
}
async function runPackageFormatterCommand({ args, command }, { cwd, patterns }) {
  const packageArguments = [command, ...args, ...patterns];
  const resolvedCommand = resolveCommand(
    (await detect({ cwd }))?.agent ?? "npm",
    "execute-local",
    packageArguments
  ) ?? { args: packageArguments, command: "npx" };
  return await spawnFormatterCommand(resolvedCommand, cwd);
}
async function spawnFormatterCommand({ args, command }, cwd) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      resolve({
        code,
        runner: "child_process",
        signal
      });
    });
  });
}
export {
  runFormatterCommand,
  runPackageFormatterCommand
};
