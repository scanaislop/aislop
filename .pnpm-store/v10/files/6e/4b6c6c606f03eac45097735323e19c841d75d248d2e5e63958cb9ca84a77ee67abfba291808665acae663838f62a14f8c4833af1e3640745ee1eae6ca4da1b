type Graph<T> = Map<T, Set<T>>;
type Groups<T> = T[][];
interface Result<T> {
    safe: boolean;
    chunks: Groups<T>;
    cycles: Groups<T>;
}
export declare function graphSequencer<T>(graph: Graph<T>, includedNodes?: T[]): Result<T>;
export {};
