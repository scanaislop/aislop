import {
  runFormatterCommand,
  runPackageFormatterCommand
} from "./runFormatterCommand.js";
function createRunCommand(command) {
  return async (options) => await runFormatterCommand(command, options);
}
function createRunPackageCommand(command) {
  return async (options) => await runPackageFormatterCommand(command, options);
}
export {
  createRunCommand,
  createRunPackageCommand
};
