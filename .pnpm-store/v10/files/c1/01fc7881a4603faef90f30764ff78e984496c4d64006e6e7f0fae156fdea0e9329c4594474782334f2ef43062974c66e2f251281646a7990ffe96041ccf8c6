type AnimationContextValue = {
    readonly renderThrottleMs: number;
    readonly subscribe: (callback: (currentTime: number) => void, interval: number) => {
        readonly startTime: number;
        readonly unsubscribe: () => void;
    };
};
declare const animationContext: import("react").Context<AnimationContextValue>;
export default animationContext;
