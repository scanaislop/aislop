export type TaskfileCommand = string | {
    cmd?: string;
    task?: string;
    defer?: string | {
        task?: string;
        [key: string]: unknown;
    };
    for?: unknown;
    [key: string]: unknown;
};
export type TaskfileTask = string | string[] | {
    cmds?: string | TaskfileCommand[];
    cmd?: string;
    [key: string]: unknown;
};
type TaskfileInclude = string | {
    taskfile: string;
    [key: string]: unknown;
};
export type TaskfileConfig = {
    tasks?: Record<string, TaskfileTask>;
    includes?: Record<string, TaskfileInclude>;
    [key: string]: unknown;
};
export {};
