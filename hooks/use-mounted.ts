import { useSyncExternalStore } from "react";

// Подписка не нужна: mounted не меняется после гидрации.
const emptySubscribe = () => () => {};

/**
 * «Смонтировано ли»: false на сервере и до гидрации, true после.
 * Замена анти-паттерну `useState(false) + useEffect(() => setMounted(true), [])`,
 * который нарушает react-hooks/set-state-in-effect (правила react-hooks v6).
 */
export function useMounted(): boolean {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false
    );
}
