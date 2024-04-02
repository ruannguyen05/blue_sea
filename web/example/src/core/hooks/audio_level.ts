import { useContext, useEffect, useState } from "react";
import type * as Bluesea from 'bluesea-media-js-sdk';
import { BlueseaSessionContext, StreamPublisherWrap } from "../components/provider";

export const useAudioLevelConsumer = (consumer?: Bluesea.StreamConsumer | Bluesea.StreamConsumerPair): number | undefined => {
    let [audio_level, setAudioLevel] = useState<number | undefined>(undefined);
    useEffect(() => {
        if(consumer) {
            let handler = (level: number) => {
                setAudioLevel(level);  
            };
            consumer.on('audio_level', handler);

            return () => {
                consumer.off('audio_level', handler);
            }
        } else {
            setAudioLevel(undefined);
            return () => {

            }
        }
    }, [consumer])
    return audio_level;
}

export const useAudioLevelProducer = (producer?: StreamPublisherWrap): number | undefined => {
    let [audio_level, setAudioLevel] = useState<number | undefined>(undefined);
    useEffect(() => {
        if(producer) {
            let handler = (level: number) => {
                setAudioLevel(level);  
            };
            producer.on('audio_level', handler);

            return () => {
                producer.off('audio_level', handler);
            }
        } else {
            setAudioLevel(undefined);
            return () => {

            }
        }
    }, [producer])
    return audio_level;
}

export interface AudioMixSlotInfo {
    peer_id: string,
    stream_name: string,
    audio_level: number
}

export const useAudioSlotMix = (slot_index: number) => {
    let [slot, setSlot] = useState<AudioMixSlotInfo | undefined>(undefined);
    let { data } = useContext(BlueseaSessionContext);
    useEffect(() => {
        let mix_minus = data?.session.getMixMinusAudio();
        if(mix_minus) {
            let handler = (info: any | null) => {
                if(info) {
                    let source_id = info[0].split(':');
                    setSlot({
                        peer_id: source_id[0],
                        stream_name: source_id[1],
                        audio_level: info[1]
                    });
                } else {
                    setSlot(undefined);
                }
            };
            mix_minus.on(`slot_${slot_index}`, handler);

            return () => {
                mix_minus?.off(`slot_${slot_index}`, handler);
            }
        } else {
            return () => {

            }
        }
    }, [slot_index, data.session.getMixMinusAudio()])
    return slot;
}

export const useAudioLevelMix = (peer_id: string, stream_name: string) => {
    let [audio_level, setAudioLevel] = useState<number | undefined>(undefined);
    let { data } = useContext(BlueseaSessionContext);
    useEffect(() => {
        let mix_minus = data?.session.getMixMinusAudio();
        if(mix_minus) {
            let handler = (level: number | null) => {
                setAudioLevel(level || undefined);  
            };
            mix_minus.on(`source_${peer_id}:${stream_name}`, handler);

            return () => {
                mix_minus?.off(`source_${peer_id}:${stream_name}`, handler);
            }
        } else {
            return () => {

            }
        }
    }, [peer_id, stream_name, data.session.getMixMinusAudio()])
    return audio_level;
}