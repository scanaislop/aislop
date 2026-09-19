import { findPackage } from "fd-package-json";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { formatters } from "./formatters/all.js";
async function resolveFormatter(cwd = ".", options = {}) {
  const orderedFormatters = orderFormatters(options.order);
  for (const directory of walkUpDirectories(cwd, options)) {
    const children = await fs.readdir(directory);
    for (const formatter of orderedFormatters) {
      for (const child of children) {
        if (formatter.testers.configFile.test(child)) {
          return formatter;
        }
      }
    }
  }
  const packageData = await findPackage(cwd);
  if (!packageData) {
    return void 0;
  }
  const { scripts = {}, ...otherKeys } = packageData;
  for (const formatter of orderedFormatters) {
    for (const script of Object.values(scripts)) {
      if (formatter.testers.script.test(script)) {
        return formatter;
      }
    }
  }
  for (const formatter of orderedFormatters) {
    if ("packageKey" in formatter.testers && formatter.testers.packageKey in otherKeys) {
      return formatter;
    }
  }
  return void 0;
}
function createStopDirectoryMatcher(stopDirectory) {
  if (typeof stopDirectory !== "string") {
    return stopDirectory;
  }
  const resolved = path.resolve(stopDirectory);
  return (currentDirectory) => currentDirectory === resolved;
}
function orderFormatters(order = []) {
  const seen = /* @__PURE__ */ new Set();
  const preferred = order.map((name) => {
    const formatter = formatters.find((formatter2) => formatter2.name === name);
    if (!formatter) {
      throw new Error(
        `Unknown formatter name in order: ${name}. Known formatters are ${formatters.map((formatter2) => formatter2.name).join(", ")}.`
      );
    }
    if (seen.has(name)) {
      throw new Error(`Duplicate formatter name in order: ${name}.`);
    }
    seen.add(name);
    return formatter;
  });
  return [.../* @__PURE__ */ new Set([...preferred, ...formatters])];
}
function* walkUpDirectories(cwd, { stopDirectory }) {
  if (stopDirectory === void 0) {
    yield cwd;
    return;
  }
  const isStopDirectory = createStopDirectoryMatcher(stopDirectory);
  let currentDirectory = path.resolve(cwd);
  while (true) {
    const parentDirectory = path.dirname(currentDirectory);
    const matched = isStopDirectory(currentDirectory);
    if (!matched && parentDirectory === currentDirectory) {
      throw new Error(
        `Reached the file system root searching up from ${path.resolve(cwd)} without matching stopDirectory.`
      );
    }
    yield currentDirectory;
    if (matched) {
      return;
    }
    currentDirectory = parentDirectory;
  }
}
export {
  resolveFormatter
};
