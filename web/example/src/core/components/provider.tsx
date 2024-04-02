import React, { useCallback, useEffect, useMemo } from 'react'
import * as Bluesea from 'bluesea-media-js-sdk';
import { DataContainer, MapContainer } from '../hooks/reaction';
import { MediaStreamArc } from '../hooks/shared_device';
import type { MediaStream2 } from '../../platform';

const logger = Bluesea.getLogger('Provider');

export enum BlueseaSessionState {
    New = 'new',
    Connecting = 'connecting',
    Connected = 'connected',
    Reconnecting = 'reconnecting',
    Disconnected = 'disconnected',
    Error = 'error',
}

export class StreamPublisherWrap {
    stream: MediaStreamArc | MediaStream2 | null = null;

    constructor(private publisher: Bluesea.StreamPublisher) {

    }

    get state() {
        return this.publisher.state;
    }

    on(type: string, callback: any) {
        this.publisher.on(type, callback);
    }

    off(type: string, callback: any) {
        this.publisher.off(type, callback);
    }

    switchStream(stream: MediaStreamArc | MediaStream2 | undefined | null, label?: string) {
        if (!!stream && stream instanceof MediaStreamArc) {
            stream.retain();
        }
        if (!!this.stream && this.stream instanceof MediaStreamArc) {
            this.stream.release();
        }
        this.stream = stream || null;
        return this.publisher.switchStream(((!!stream && stream instanceof MediaStreamArc) ? stream?.stream : stream) || null);
    }
}

interface ArcContainer<T> {
    data: T,
    owners: Map<number, number>,
}

interface BlueseaSessionContainer {
    session: Bluesea.BlueSeaSession;
    state: DataContainer<BlueseaSessionState>,
    room_stats: DataContainer<Bluesea.RoomStats>,
    my_streams: MapContainer<string, Bluesea.StreamRemote>;
    remote_streams: MapContainer<string, Bluesea.StreamRemote>;
    peer_streams: MapContainer<string, Bluesea.StreamRemote[]>;
    publishers: MapContainer<string, ArcContainer<StreamPublisherWrap>>;
    consumers: MapContainer<string, ArcContainer<Bluesea.StreamConsumer>>;
    consumer_pairs: MapContainer<string, ArcContainer<Bluesea.StreamConsumerPair>>;
    shared_data: MapContainer<string, any>;
    connect: (onError?: (err: any) => void) => Promise<void>;
    restart_ice: () => Promise<void>;
    disconnect: () => void;
    destroy: () => void;
}

interface BlueseaSessionContextInfo {
    data: BlueseaSessionContainer,
    get_publisher(owner_id: number, cfg: Bluesea.SenderConfig): StreamPublisherWrap;
    back_publisher(owner_id: number, cfg: Bluesea.SenderConfig): void;
    get_consumer(owner_id: number, remote: Bluesea.StreamRemote): Bluesea.StreamConsumer;
    back_consumer(owner_id: number, remote: Bluesea.StreamRemote): void;
    get_consumer_pair(owner_id: number, peer_id: string, audio_name: string, video_name: string): Bluesea.StreamConsumerPair;
    back_consumer_pair(owner_id: number, peer_id: string, audio_name: string, video_name: string): void;
}

export const BlueseaSessionContext = React.createContext({} as BlueseaSessionContextInfo);

interface Props {
    children: React.ReactNode;
    logLevel?: Bluesea.LogLevel;
    autoConnect?: boolean;
    onConnectError?: (err: any) => void;
    gateways: string | string[];
    room: string;
    peer: string;
    token: string;
    mixMinusAudio?: {
        elements?: [
            HTMLAudioElement,
            HTMLAudioElement,
            HTMLAudioElement
        ];
        mode: Bluesea.MixMinusMode;
    };
    latencyMode?: Bluesea.LatencyMode;
    iceServers?: [
        {
            urls: string;
            username?: string;
            credential?: string;
        }
    ];
    codecs?: Bluesea.BlueSeaCodec[];
    senders?: Bluesea.SenderConfig[];
    receivers?: Bluesea.PreReceiver;
    bitrateControlMode?: Bluesea.BitrateControlMode;
}

const StreamKey = (stream: Bluesea.StreamRemote) => {
    return stream.peer_id + '-' + stream.name;
}

export const BlueseaSessionProvider = (props: Props) => {
    if(props.logLevel !== undefined) {
        Bluesea.setLogLevel(props.logLevel);
    }

    const session_container = useMemo<BlueseaSessionContainer>(() => {
        logger.info("creating bluesea session", props);
        let session = Bluesea.createBlueSeaSession(props.gateways, {
            room_id: props.room,
            peer_id: props.peer,
            token: props.token,
            senders: props.senders || [],
            receivers: props.receivers || { audio: 1, video: 1 },
            mix_minus_audio: props.mixMinusAudio,
            latency_mode: props.latencyMode,
            ice_servers: props.iceServers,
            bitrate_control_mode: props.bitrateControlMode,
            codecs: props.codecs,
        });
        let state = new DataContainer<BlueseaSessionState>(BlueseaSessionState.New);
        let room_stats = new DataContainer<Bluesea.RoomStats>({ peers: 0 });
        let my_streams = new MapContainer<string, Bluesea.StreamRemote>;
        let remote_streams = new MapContainer<string, Bluesea.StreamRemote>;
        let peer_streams = new MapContainer<string, Bluesea.StreamRemote[]>;
        let publishers = new MapContainer<string, ArcContainer<StreamPublisherWrap>>;
        let consumers = new MapContainer<string, ArcContainer<Bluesea.StreamConsumer>>;
        let consumer_pairs = new MapContainer<string, ArcContainer<Bluesea.StreamConsumerPair>>;
        let shared_data = new MapContainer<string, any>;

        const on_connected = () => {
            state.change(BlueseaSessionState.Connected);
        };

        const on_reconnecting = () => {
            state.change(BlueseaSessionState.Reconnecting);
        };

        const on_reconnected = () => {
            state.change(BlueseaSessionState.Connected);
        };

        const on_room_stats = (_room_stats: Bluesea.RoomStats) => {
            room_stats.change(_room_stats);
        };

        const on_my_stream_added = (stream: Bluesea.StreamRemote) => {
            my_streams.set(StreamKey(stream), stream);
            let list = (peer_streams.get(stream.peer_id) || []).filter((s) => s.name !== stream.name);
            peer_streams.set(stream.peer_id, list.concat(stream));
        };

        const on_my_stream_removed = (stream: Bluesea.StreamRemote) => {
            my_streams.del(StreamKey(stream));
            let list = (peer_streams.get(stream.peer_id) || []).filter((s) => s.name !== stream.name);
            peer_streams.set(stream.peer_id, list);
        };

        const on_stream_added = (stream: Bluesea.StreamRemote) => {
            remote_streams.set(StreamKey(stream), stream);
            let list = (peer_streams.get(stream.peer_id) || []).filter((s) => s.name !== stream.name);
            peer_streams.set(stream.peer_id, list.concat(stream));
        };

        const on_stream_removed = (stream: Bluesea.StreamRemote) => {
            remote_streams.del(StreamKey(stream));
            let list = (peer_streams.get(stream.peer_id) || []).filter((s) => s.name !== stream.name);
            peer_streams.set(stream.peer_id, list);
        };

        const on_disconnected = () => {
            state.change(BlueseaSessionState.Disconnected);
        };

        const connect = async (onError?: (err: any) => void) => {
            session.connect().catch((err) => {
                state.change(BlueseaSessionState.Error);
                if (onError) {
                    onError(err);
                }
            });

            state.change(BlueseaSessionState.Connecting);
        };

        const restart_ice = () => {
            return session.restartIce();
        };

        const disconnect = () => {
            switch (state.value) {
                case BlueseaSessionState.Connecting:
                case BlueseaSessionState.Connected:
                    session.disconnect();
                    break;
            }
        };

        const destroy = () => {
            session.off(Bluesea.BlueSeaSessionEvent.CONNECTED, on_room_stats);
            session.off(Bluesea.BlueSeaSessionEvent.RECONNECTING, on_reconnecting);
            session.off(Bluesea.BlueSeaSessionEvent.RECONNECTED, on_reconnected);
            session.off(Bluesea.BlueSeaSessionEvent.ROOM_STATS, on_room_stats);
            session.off(Bluesea.BlueSeaSessionEvent.MY_STREAM_ADDED, on_my_stream_added);
            session.off(Bluesea.BlueSeaSessionEvent.MY_STREAM_REMOVED, on_my_stream_removed);
            session.off(Bluesea.BlueSeaSessionEvent.STREAM_ADDED, on_stream_added);
            session.off(Bluesea.BlueSeaSessionEvent.STREAM_REMOVED, on_stream_removed);
            session.off(Bluesea.BlueSeaSessionEvent.DISCONNECTED, on_disconnected);
            disconnect();
            session_container.state.change(BlueseaSessionState.Disconnected);
        };

        session.on(Bluesea.BlueSeaSessionEvent.CONNECTED, on_connected);
        session.on(Bluesea.BlueSeaSessionEvent.RECONNECTING, on_reconnecting);
        session.on(Bluesea.BlueSeaSessionEvent.RECONNECTED, on_reconnected);
        session.on(Bluesea.BlueSeaSessionEvent.ROOM_STATS, on_room_stats);
        session.on(Bluesea.BlueSeaSessionEvent.MY_STREAM_ADDED, on_my_stream_added);
        session.on(Bluesea.BlueSeaSessionEvent.MY_STREAM_REMOVED, on_my_stream_removed);
        session.on(Bluesea.BlueSeaSessionEvent.STREAM_ADDED, on_stream_added);
        session.on(Bluesea.BlueSeaSessionEvent.STREAM_REMOVED, on_stream_removed);
        session.on(Bluesea.BlueSeaSessionEvent.DISCONNECTED, on_disconnected);

        if (typeof props.autoConnect === 'undefined' || props.autoConnect === true) {
            connect(props.onConnectError)
        }

        return {
            session,
            state,
            room_stats,
            my_streams,
            remote_streams,
            peer_streams,
            publishers,
            consumers,
            consumer_pairs,
            shared_data,
            connect,
            restart_ice,
            disconnect,
            destroy,
        };
    }, [props.gateways, props.room, props.peer]);

    useEffect(() => {
        return session_container.destroy;
    }, [session_container])

    let get_publisher = useCallback((owner_id: number, cfg: Bluesea.SenderConfig) => {
        let publisher = session_container.publishers.get(cfg.name);
        if (!publisher) {
            publisher = {
                data: new StreamPublisherWrap(session_container.session.createPublisher({
                    stream: cfg.stream,
                    name: cfg.name,
                    kind: cfg.kind,
                    prefer_codecs: cfg.prefer_codecs,
                    simulcast: cfg.simulcast,
                    max_bitrate: cfg.max_bitrate,
                    content_hint: cfg.content_hint,
                    screen: cfg.screen
                })),
                owners: new Map(),
            };
            session_container.publishers.set(cfg.name, publisher);
        }
        publisher.owners.set(owner_id, new Date().getTime());
        return publisher.data;
    }, [session_container]);

    let back_publisher = useCallback((owner_id: number, cfg: Bluesea.SenderConfig) => {
        let publisher = session_container.publishers.get(cfg.name);
        if (publisher) {
            publisher.owners.delete(owner_id);
            if (publisher.owners.size === 0) {
                publisher.data.switchStream(null);
                session_container.publishers.del(cfg.name);
            }
        }
    }, [session_container]);

    let get_consumer = useCallback((owner_id: number, stream: Bluesea.StreamRemote) => {
        let key = StreamKey(stream);
        let consumer = session_container.consumers.get(key);
        if (!consumer) {
            consumer = {
                data: session_container.session.createConsumer(stream),
                owners: new Map(),
            };
            session_container.consumers.set(key, consumer);
        }
        consumer.owners.set(owner_id, new Date().getTime());
        return consumer.data;
    }, [session_container]);

    let back_consumer = useCallback((owner_id: number, stream: Bluesea.StreamRemote) => {
        let key = StreamKey(stream);
        let consumer = session_container.consumers.get(key);
        if (consumer) {
            consumer.owners.delete(owner_id);
            if (consumer.owners.size === 0) {
                session_container.consumers.del(key);
            }
        }
    }, [session_container]);


    let get_consumer_pair = useCallback((owner_id: number, peer_id: string, audio_name: string, video_name: string) => {
        let key = peer_id + '-' + audio_name + '-' + video_name;
        let consumer = session_container.consumer_pairs.get(key);
        if (!consumer) {
            consumer = {
                data: session_container.session.createConsumerPair(peer_id, audio_name, video_name),
                owners: new Map(),
            };
            session_container.consumer_pairs.set(key, consumer);
        }
        consumer.owners.set(owner_id, new Date().getTime());
        return consumer.data;
    }, [session_container]);

    let back_consumer_pair = useCallback((owner_id: number, peer_id: string, audio_name: string, video_name: string) => {
        let key = peer_id + '-' + audio_name + '-' + video_name;
        let consumer = session_container.consumer_pairs.get(key);
        if (consumer) {
            consumer.owners.delete(owner_id);
            if (consumer.owners.size === 0) {
                session_container.consumer_pairs.del(key);
            }
        }
    }, [session_container]);

    return (
        <BlueseaSessionContext.Provider value={{
            data: session_container,
            get_publisher, back_publisher,
            get_consumer, back_consumer,
            get_consumer_pair, back_consumer_pair,
        }}>
            {props.children}
        </BlueseaSessionContext.Provider>
    )
}