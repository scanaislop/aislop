import { spawn } from "node:child_process";
import { PACKAGE_ROOT } from "./fs-utils.mjs";

export const runCommand = (command, args, options = {}) =>
	new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: options.cwd ?? PACKAGE_ROOT,
			env: options.env ? { ...process.env, ...options.env } : process.env,
			stdio: ["ignore", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";

		child.stdout.on("data", (chunk) => {
			stdout += chunk.toString();
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk.toString();
		});

		child.on("error", reject);
		child.on("close", (code, signal) => {
			resolve({
				command,
				args,
				code: code ?? 1,
				signal,
				stdout,
				stderr,
			});
		});
	});
