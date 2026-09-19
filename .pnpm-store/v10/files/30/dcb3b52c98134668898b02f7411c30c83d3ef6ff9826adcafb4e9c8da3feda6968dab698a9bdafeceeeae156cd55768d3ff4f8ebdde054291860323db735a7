import { PureComponent, type ReactNode } from 'react';
type Props = {
    readonly children: ReactNode;
    readonly onError: (error: Error) => void;
};
type State = {
    readonly error?: Error;
};
export default class ErrorBoundary extends PureComponent<Props, State> {
    static displayName: string;
    static getDerivedStateFromError(error: Error): {
        error: Error;
    };
    state: State;
    componentDidCatch(error: Error): void;
    render(): ReactNode;
}
export {};
