import { EventEmitter } from "bluesea-media-js-sdk";
import { useEffect, useMemo } from "react";
import { MediaStream2, MediaStreamConstraints, mediaDevices } from "../../platform/device";
import { DataContainer, useReactionData } from "./reaction";

export class MediaStreamArc {
    refCount = 0;
    constructor(public stream: MediaStream2) {

    }

    retain() {
        this.refCount += 1;
    }

    release() {
        this.refCount -= 1;
        if (this.refCount === 0) {
            this.stream.getTracks().map((t) => t.stop());
        }
        return this.refCount;
    }
}

export type MediaStreamChanger = (constraints?: MediaStreamConstraints | MediaStreamArc) => void;

interface Return {
    media?: MediaStreamArc,
    error?: Error,
}

const EVENT = 'changed';

class StreamSlot extends EventEmitter {
    refCount = 0;
    data: Return = {};
    queue: (MediaStreamConstraints | MediaStreamArc | undefined)[] = [];

    constructor(_key: string, private isScreen: boolean) {
        super()
    }

    retain() {
        this.refCount += 1;
    }

    release() {
        this.refCount -= 1;
        if (this.refCount === 0) {
            this.request(undefined);
        }
        return this.refCount;
    }

    request = (constraints?: MediaStreamConstraints | MediaStreamArc) => {
        this.requestAsync(constraints);
    }

    async requestAsync(constraints?: MediaStreamConstraints | MediaStreamArc) {
        this.queue.push(constraints);
        if (this.queue.length === 1) {
            while (this.queue.length > 0) {
                let job = this.queue.shift();
                await this.processing(job);
            }
        }
    }

    async processing(constraints?: MediaStreamConstraints | MediaStreamArc) {
        if (!!this.data.media) {
            this.data.media.release();
            this.data = { };
            this.emit(EVENT, this.data);
        }

        if (!!constraints) {
            if (constraints instanceof MediaStreamArc) {
                this.data = { media: constraints };
                this.emit(EVENT, this.data);
            } else {
                try {
                    let stream: MediaStream2 | undefined = undefined;
                    if (this.isScreen) {
                        stream = await mediaDevices.getDisplayMedia(constraints);
                    } else {
                        stream = await mediaDevices.getUserMedia(constraints);
                    }
                    let wraper = new MediaStreamArc(stream);
                    wraper.retain();
                    this.data = { media: wraper };
                    this.emit(EVENT, this.data);
                } catch (err: any) {
                    this.data = { error: err as Error };
                    this.emit(EVENT, this.data);
                }
            }
        }
    }
}

let global_store: Map<string, StreamSlot> = new Map();

const useSharedRawMedia = (key: string, is_screen: boolean): [MediaStreamArc | undefined, Error | undefined, MediaStreamChanger] => {
    const data = useMemo(() => new DataContainer<Return>({}), []);
    const stream_slot = useMemo(() => {
        let slot = global_store.get(key);
        if (!slot) {
            slot = new StreamSlot(key, is_screen);
            global_store.set(key, slot);
        }
        data.change(slot.data);
        slot.on(EVENT, data.change);
        return slot;
    }, [key, data]);

    useEffect(() => {
        stream_slot.retain();
        return () => {
            if(stream_slot.release() === 0) {
                global_store.delete(key);
            }
            stream_slot.off(EVENT, data.change);
        }
    }, [key, stream_slot, data]);
    const data_value = useReactionData(data);

    return [data_value?.media, data_value?.error, stream_slot.request];
}

export const useSharedUserMedia = (key: string): [MediaStreamArc | undefined, Error | undefined, MediaStreamChanger] => {
    return useSharedRawMedia(key, false);
}

export const useSharedDisplayMedia = (key: string): [MediaStreamArc | undefined, Error | undefined, MediaStreamChanger] => {
    return useSharedRawMedia(key, true);
}