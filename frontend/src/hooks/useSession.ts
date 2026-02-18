import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSession as setSessionAction, clearSession as clearSessionAction } from '../store/slices/sessionSlice';

type Session = {
    connectionId: string | null;
    name: string | null;
    setSession: (connectionId: string, name: string) => void;
    clearSession: () => void;
};

export const useSession = (): Session => {
    const { connectionId, name } = useAppSelector((state) => state.session);
    const dispatch = useAppDispatch();

    const setSession = (connectionId: string, name: string) => {
        dispatch(setSessionAction({ connectionId, name }));
    };

    const clearSession = () => {
        dispatch(clearSessionAction());
    };

    return {
        connectionId,
        name,
        setSession,
        clearSession,
    };
};
