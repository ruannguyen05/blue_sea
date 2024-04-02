import { useContext, useEffect, useState, useMemo } from "react";
import { BlueseaSessionContext } from "../components/provider";
import * as Bluesea from 'bluesea-media-js-sdk';
import { useReactionList } from "./reaction";

export const useRemoteStreamState = (remote: Bluesea.StreamRemote): Bluesea.StreamRemoteState => {
    const [state, setState] = useState(remote.state);

    useEffect(() => {
        const handler = () => {
            setState(remote.state);
        }
        remote.on(Bluesea.StreamRemoteEvent.STATE, handler);
        return () => {
            remote.off(Bluesea.StreamRemoteEvent.STATE, handler);
        }
    }, [remote]);
    return state;
}

export const useRemoteStreamQuality = (remote: Bluesea.StreamRemote | undefined): Bluesea.RemoteStreamQuality | undefined => {
    const [quality, setQuality] = useState<Bluesea.RemoteStreamQuality | undefined>();

    useEffect(() => {
        if (!!remote) {
            const handler = (quality: Bluesea.RemoteStreamQuality | undefined) => {
                setQuality(quality || undefined);
            }
            remote.on(Bluesea.StreamRemoteEvent.QUALITY, handler);
            return () => {
                remote.off(Bluesea.StreamRemoteEvent.QUALITY, handler);
            }
        } else {
            return () => {}
        }
    }, [remote]);
    return quality;
}

export const useRemoteStreams = (kind: Bluesea.StreamKinds, is_my?: boolean): Bluesea.StreamRemote[] => {
    const { data } = useContext(BlueseaSessionContext);
    let source = (is_my === true) ? data.my_streams : data.remote_streams;
    let list = useReactionList(source);

    return useMemo(() => {
        return list.filter((s) => s.kind === kind);
    }, [list]);
}

export const useActiveRemoteStreams = (kind: Bluesea.StreamKinds, is_my?: boolean): Bluesea.StreamRemote[] => {
    const [ver, setVer] = useState(0);
    const list = useRemoteStreams(kind, is_my);

    useEffect(() => {
        const handler = () => {
            setVer(new Date().getTime());
        }
        list.map((item) => item.on(Bluesea.StreamRemoteEvent.STATE, handler));
        return () => {
            list.map((item) => item.off(Bluesea.StreamRemoteEvent.STATE, handler));
        }
    }, [list]);
    
    return useMemo(() => {
        return list.filter((s) => s.state.active);
    }, [list, ver]);
}

export const usePeerRemoteStreams = (peer_id: string, kind?: Bluesea.StreamKinds): Bluesea.StreamRemote[] => {
    const { data } = useContext(BlueseaSessionContext);
    const [list, setList] = useState<Bluesea.StreamRemote[]>([]);

    useEffect(() => {
        const setListWrap = !!kind ? (list: Bluesea.StreamRemote[]) => {
            setList(list.filter((s) => s.kind === kind));
        } : setList;
        setListWrap(data.peer_streams.get(peer_id) || []);
        data.peer_streams.onSlotChanged(peer_id, setListWrap);
        return () => {
            data.peer_streams.offSlotChanged(peer_id, setListWrap);
        }
    }, [peer_id, kind, setList])
    return list;
}

export const usePeerRemoteStream = (peer_id: string, name: string): Bluesea.StreamRemote | undefined => {
    const { data } = useContext(BlueseaSessionContext);
    const [stream, setStream] = useState<Bluesea.StreamRemote | undefined>(undefined);

    useEffect(() => {
        const setListWrap = (list: Bluesea.StreamRemote[]) => {
            setStream(list.filter((s) => s.name === name)[0]);
        };
        setListWrap(data.peer_streams.get(peer_id) || []);
        data.peer_streams.onSlotChanged(peer_id, setListWrap);
        return () => {
            data.peer_streams.offSlotChanged(peer_id, setListWrap);
        }
    }, [peer_id, name, setStream])
    return stream;
}

export const usePeerActiveRemoteStreams = (peer_id: string, kind?: Bluesea.StreamKinds): Bluesea.StreamRemote[] => {
    const raw_list = usePeerRemoteStreams(peer_id, kind);
    const [list, setList] = useState<Bluesea.StreamRemote[]>(() => {
        return raw_list.filter((s) => s.state.active);
    });

    useEffect(() => {
        const handler = () => {
            setList(raw_list.filter((s) => s.state.active));
        }
        raw_list.map((item) => item.on(Bluesea.StreamRemoteEvent.STATE, handler));
        return () => {
            raw_list.map((item) => item.off(Bluesea.StreamRemoteEvent.STATE, handler));
        }
    }, [raw_list]);
    return list;
}

export const usePeers = (): string[] => {
    const { data } = useContext(BlueseaSessionContext);
    const list = useReactionList(data.peer_streams);
    return useMemo(() => {
        return list.filter((p) => p.length > 0).map((p) => p[0]!.peer_id);
    }, [list]);
}