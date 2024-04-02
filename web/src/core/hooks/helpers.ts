import { useEffect, useMemo } from "react";
import { DataContainer, useReactionData } from "./reaction";

interface Slot<T> { data: DataContainer<T>, refCount: number }
const global_store = new Map<string, Slot<any>>();

export function useSharedData<T>(key: string, init: (T | (() => T))): [T, (value: T) => void] {
    let slot: Slot<T> = useMemo(() => {
        let slot = global_store.get(key);
        if(!slot) {
            slot = { data: new DataContainer<T>(init), refCount: 0 };
            global_store.set(key, slot);
        }
        return slot;
    }, [key]);
    useEffect(() => {
        slot.refCount += 1;
        return () => {
            slot.refCount -= 1;
            if (slot.refCount === 0) {
                global_store.delete(key);
            }
        }
    }, [slot]);

    let value = useReactionData(slot.data);
    return [value, slot.data.change];
}