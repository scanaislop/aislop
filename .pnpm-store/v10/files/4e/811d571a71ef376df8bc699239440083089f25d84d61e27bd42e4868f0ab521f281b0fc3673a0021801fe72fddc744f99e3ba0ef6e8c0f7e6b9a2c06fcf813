import { useEffect, useContext, useMemo } from 'react';
import FocusContext from '../components/FocusContext.js';
import useStdin from './use-stdin.js';
/**
A React hook that returns focus state and focus controls for the current component.
A component that uses the `useFocus` hook becomes "focusable" to Ink, so when the user presses <kbd>Tab</kbd>, Ink will switch focus to this component. If there are multiple components that execute the `useFocus` hook, focus will be given to them in the order in which these components are rendered.
*/
const useFocus = ({ isActive = true, autoFocus = false, id: customId, } = {}) => {
    const { isRawModeSupported, setRawMode } = useStdin();
    const { activeId, add, remove, activate, deactivate, focus } = useContext(FocusContext);
    const id = useMemo(() => {
        return customId ?? Math.random().toString().slice(2, 7);
    }, [customId]);
    useEffect(() => {
        add(id, { autoFocus });
        return () => {
            remove(id);
        };
    }, [id, autoFocus, add, remove]);
    useEffect(() => {
        if (isActive) {
            activate(id);
        }
        else {
            deactivate(id);
        }
    }, [isActive, id, activate, deactivate]);
    useEffect(() => {
        if (!isRawModeSupported || !isActive) {
            return;
        }
        setRawMode(true);
        return () => {
            setRawMode(false);
        };
    }, [isActive, isRawModeSupported, setRawMode]);
    return {
        isFocused: Boolean(id) && activeId === id,
        focus,
    };
};
export default useFocus;
//# sourceMappingURL=use-focus.js.map