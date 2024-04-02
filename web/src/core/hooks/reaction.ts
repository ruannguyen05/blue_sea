import { EventEmitter } from "bluesea-media-js-sdk";
import { useEffect, useState } from "react";

export class DataContainer<T> extends EventEmitter {
    data: T;
    version: number = 0;
    constructor(init: T | (() => T)) {
        super();
        if(typeof init === 'function') {
            this.data = (init as any)();
        } else {
            this.data = init;
        }
    }

    get value(): T {
        return this.data;
    }

    change = (new_value: T) => {
        this.data = new_value;
        this.emit('changed', new_value);
    }

    addChangeListener = (callback: (data: T) => void) => {
        this.on('changed', callback);
    }

    removeChangeListener = (callback: (data: T) => void) => {
        this.off('changed', callback);
    }
}

export class MapContainer<K, T> extends EventEmitter {
    map: Map<K, T> = new Map();
    list: T[] = [];

    constructor() {
        super();
    }

    set(key: K, value: T) {
        this.map.set(key, value);
        this.list = Array.from(this.map.values());
        this.emit('list', this.list);
        this.emit('map', this.map);
        this.emit('slot_' + key, value);
    }

    has(key: K): boolean {
        return this.map.has(key);
    }

    get(key: K): T | undefined {
        return this.map.get(key);
    }

    del(key: K) {
        this.map.delete(key);
        this.list = Array.from(this.map.values());
        this.emit('list', this.list);
        this.emit('map', this.map);
        this.emit('slot_' + key, undefined);
    }

    onSlotChanged = (slot: K, handler: (data: T) => void) => {
        this.on('slot_' + slot, handler);
    }

    offSlotChanged = (slot: K, handler: (data: T) => void) => {
        this.off('slot_' + slot, handler);
    }

    onMapChanged = (handler: (map: Map<K, T>) => void) => {
        this.on('map', handler);
    }

    offMapChanged = (handler: (map: Map<K, T>) => void) => {
        this.on('map', handler);
    }

    onListChanged = (handler: (map: T[]) => void) => {
        this.on('list', handler);
    }

    offListChanged = (handler: (map: T[]) => void) => {
        this.on('list', handler);
    }
}

export function useReactionData<T>(container: DataContainer<T>): T {
    let [data, setData] = useState(container.data);
    useEffect(() => {
        container.addChangeListener(setData);
        return () => {
            container.removeChangeListener(setData);
        }
    }, [container, setData]);
    return data;
}
export function useReactionList<K, T>(containter: MapContainer<K, T>): T[] {
    let [list, setList] = useState<T[]>(containter.list);
    useEffect(() => {
        containter.onListChanged(setList);
        return () => {
            containter.offListChanged(setList);
        }
    }, [containter, setList]);
    return list;
}