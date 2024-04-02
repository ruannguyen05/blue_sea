import { useContext, useEffect, useMemo, useState } from "react";
import { BlueseaSessionContext } from "../components/provider";
import * as Bluesea from 'bluesea-media-js-sdk';
import type { MediaStream2 } from "../../platform";

let id_seed = 0;
export const useConsumer = (remote: Bluesea.StreamRemote, priority?: number, min_spatial?: number, max_spatial?: number, min_temporal?: number, max_temporal?: number): Bluesea.StreamConsumer => {
    const consumer_id = useMemo(() => id_seed++, []);
    const { get_consumer, back_consumer } = useContext(BlueseaSessionContext);
    const consumer = useMemo(() => {
        return get_consumer(consumer_id, remote);
    }, [remote.peer_id, remote.name]);

    useEffect(() => {
        consumer.view('use-consumer-' + consumer_id, priority, min_spatial, max_spatial, min_temporal, max_temporal);
        return () => {
            consumer.unview('use-consumer-' + consumer_id);
            back_consumer(consumer_id, remote);
        }
    }, [remote.peer_id, remote.name]);

    useEffect(() => {
        let handler = (state: Bluesea.StreamReceiverState) => {
            switch (state) {
                case Bluesea.StreamReceiverState.Connecting:
                    break;
                default:
                    consumer.limit('use-consumer-' + consumer_id, priority, min_spatial, max_spatial, min_temporal, max_temporal);
            }
        }
        handler(consumer.state);
        consumer.on('state', handler);

        return () => {
            consumer.off('state', handler);
        }
    }, [consumer, priority, min_spatial, max_spatial, min_temporal, max_temporal])

    return consumer;
}

export const useConsumerSingle = (peer_id: string, stream: string, kind: Bluesea.StreamKinds, priority?: number, min_spatial?: number, max_spatial?: number, min_temporal?: number, max_temporal?: number): Bluesea.StreamConsumer => {
    return useConsumer(new Bluesea.StreamRemote(kind, peer_id, 0, stream), priority, min_spatial, max_spatial, min_temporal, max_temporal);
}

export const useConsumerPair = (peer_id: string, audio_name: string, video_name: string, priority?: number, min_spatial?: number, max_spatial?: number, min_temporal?: number, max_temporal?: number): Bluesea.StreamConsumerPair => {
    const consumer_id = useMemo(() => id_seed++, []);
    const { get_consumer_pair, back_consumer_pair } = useContext(BlueseaSessionContext);
    const consumer = useMemo(() => {
        return get_consumer_pair(consumer_id, peer_id, audio_name, video_name);
    }, [peer_id, audio_name, video_name]);

    useEffect(() => {
        consumer.view('use-consumer-' + consumer_id, priority, min_spatial, max_spatial, min_temporal, max_temporal)
        return () => {
            consumer.unview('use-consumer-' + consumer_id);
            back_consumer_pair(consumer_id, peer_id, audio_name, video_name);
        }
    }, [peer_id, audio_name, video_name]);

    useEffect(() => {
        const handler = (state: Bluesea.StreamReceiverState) => {
            switch (state) {
                case Bluesea.StreamReceiverState.Connecting:
                    break;
                default:
                    consumer.limit('use-consumer-' + consumer_id, priority, min_spatial, max_spatial, min_temporal, max_temporal);
            }
        }
        handler(consumer.state);
        consumer.on('state', handler);

        return () => {
            consumer.off('state', handler);
        }
    }, [consumer, priority, min_spatial, max_spatial, min_temporal, max_temporal])
    
    return consumer;
}

export const useConsumerState = (consumer: Bluesea.StreamConsumerPair | Bluesea.StreamConsumer): [Bluesea.StreamReceiverState, MediaStream2 | undefined] => {
    const [state, setState] = useState(consumer.state);
    const [, setHasTrack] = useState(() => !!consumer.stream && consumer.stream.getTracks().length > 0);

    //Checking for ensure stream ready
    useEffect(() => {
        const stream = consumer.stream;
        if (stream && stream.getTracks().length === 0) {
            const check_track = () => {
                if (stream.getTracks().length > 0) {
                    setHasTrack(true);
                }
            }
            consumer.on('addtrack', check_track);
            return () => {
                consumer.off('addtrack', check_track);
            }
        } else {
            return () => {

            }
        }
    }, [consumer.stream])

    useEffect(() => {
        consumer.on('state', setState);
        return () => {
            consumer.off('state', setState);
        }
    }, [consumer]);

    return [state, consumer.stream]
}

export const useConsumerQuality = (consumer: Bluesea.StreamConsumerPair | Bluesea.StreamConsumer): Bluesea.RemoteStreamQuality | undefined => {
    const [quality, setQuality] = useState<Bluesea.RemoteStreamQuality | undefined>();

    useEffect(() => {
        const handler = (quality: Bluesea.RemoteStreamQuality | undefined) => {
            setQuality(quality || undefined);
        }
        consumer.on(Bluesea.StreamRemoteEvent.QUALITY, handler);
        return () => {
            consumer.off(Bluesea.StreamRemoteEvent.QUALITY, handler);
        }
    }, [consumer]);
    return quality;
}