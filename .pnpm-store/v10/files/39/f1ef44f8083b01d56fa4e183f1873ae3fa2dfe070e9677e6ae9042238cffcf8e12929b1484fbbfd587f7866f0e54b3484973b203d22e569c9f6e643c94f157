import { isFile } from '../../util/fs.js';
import { toConfig } from '../../util/input.js';
import { join, relative } from '../../util/path.js';
const title = 'Taskfile';
const enablers = 'This plugin is enabled when a Taskfile is found (Taskfile.yml, taskfile.yml, Taskfile.yaml, taskfile.yaml, etc.).';
const isRootOnly = true;
const config = [
    'Taskfile.yml',
    'taskfile.yml',
    'Taskfile.yaml',
    'taskfile.yaml',
    'Taskfile.dist.yml',
    'taskfile.dist.yml',
    'Taskfile.dist.yaml',
    'taskfile.dist.yaml',
];
const isEnabled = ({ cwd, config: wsConfig }) => {
    if (wsConfig.taskfile)
        return true;
    return config.some(file => isFile(cwd, file));
};
const extractScriptsFromCommand = (command) => {
    const scripts = [];
    if (typeof command === 'string') {
        scripts.push(command);
    }
    else if (command && typeof command === 'object') {
        if (command.cmd && typeof command.cmd === 'string') {
            scripts.push(command.cmd);
        }
        if (command.defer) {
            if (typeof command.defer === 'string') {
                scripts.push(command.defer);
            }
            else if (command.defer && typeof command.defer === 'object' && 'cmd' in command.defer) {
                if (typeof command.defer.cmd === 'string') {
                    scripts.push(command.defer.cmd);
                }
            }
        }
        if (command.for && 'cmd' in command && typeof command.cmd === 'string') {
            scripts.push(command.cmd);
        }
    }
    return scripts;
};
const extractScriptsFromTask = (task) => {
    const scripts = [];
    if (typeof task === 'string') {
        scripts.push(task);
        return scripts;
    }
    if (Array.isArray(task)) {
        for (const cmd of task) {
            if (typeof cmd === 'string') {
                scripts.push(cmd);
            }
        }
        return scripts;
    }
    if (task && typeof task === 'object') {
        if (task.cmd && typeof task.cmd === 'string') {
            scripts.push(task.cmd);
        }
        if (task.cmds) {
            if (typeof task.cmds === 'string') {
                scripts.push(task.cmds);
            }
            else if (Array.isArray(task.cmds)) {
                for (const cmd of task.cmds) {
                    scripts.push(...extractScriptsFromCommand(cmd));
                }
            }
        }
    }
    return scripts;
};
const resolveConfig = async (localConfig, options) => {
    if (!localConfig || !options.configFilePath)
        return [];
    const { configFilePath, getInputsFromScripts, isProduction, configFileDir } = options;
    const inputs = [];
    if (localConfig.includes && typeof localConfig.includes === 'object') {
        for (const includeValue of Object.values(localConfig.includes)) {
            const includePath = typeof includeValue === 'string'
                ? includeValue
                : includeValue && typeof includeValue === 'object' && 'taskfile' in includeValue
                    ? includeValue.taskfile
                    : undefined;
            if (includePath) {
                const resolvedPath = join(configFileDir, includePath);
                inputs.push(toConfig('taskfile', relative(configFileDir, resolvedPath), { containingFilePath: configFilePath }));
            }
        }
    }
    if (localConfig.tasks && typeof localConfig.tasks === 'object') {
        for (const task of Object.values(localConfig.tasks)) {
            for (const script of extractScriptsFromTask(task)) {
                for (const input of getInputsFromScripts([script], {
                    knownBinsOnly: true,
                    containingFilePath: configFilePath,
                })) {
                    if (isProduction)
                        Object.assign(input, { optional: true });
                    inputs.push({ ...input, dir: configFileDir });
                }
            }
        }
    }
    return inputs;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
    isRootOnly,
};
export default plugin;
