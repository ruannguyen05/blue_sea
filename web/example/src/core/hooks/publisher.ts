import { useContext, useEffect, useMemo, useState } from "react";
import { BlueseaSessionContext, StreamPublisherWrap } from "../components/provider";
import type * as Bluesea from 'bluesea-media-js-sdk';
import type { MediaStreamArc } from "./shared_device";
import type { MediaStream2 } from "../../platform";

let id_seed = 0;

export const usePublisher = (cfg: Bluesea.SenderConfig): StreamPublisherWrap => {
    const publisher_id = useMemo(() => id_seed++, []);
    const { data, get_publisher, back_publisher } = useContext(BlueseaSessionContext);
    const publisher = useMemo(() => {
        return get_publisher(publisher_id, cfg)
    }, [data, get_publisher, cfg.kind + cfg.name]);
    
    useEffect(() => {
        return () => {
            back_publisher(publisher_id, cfg);
        }
    }, [publisher]);

    return publisher;
}

export const usePublisherState = (publisher: StreamPublisherWrap): [Bluesea.StreamSenderState, MediaStreamArc | MediaStream2 | undefined] => {
    const [state, setState] = useState<Bluesea.StreamSenderState>(publisher.state);
    useEffect(() => {
        publisher.on('state', setState);
        return () => {
            publisher.off('state', setState);
        }
    }, [publisher]);

    return [state, publisher.stream || undefined]
}