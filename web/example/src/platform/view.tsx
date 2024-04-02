import { useCallback, useEffect, useMemo } from "react";
import { DataContainer } from "../core/hooks/reaction";
import * as Bluesea from 'bluesea-media-js-sdk';
import { MediaStream2 } from ".";
import { StreamRemote } from 'bluesea-media-js-sdk';
import React, { MediaHTMLAttributes } from 'react';
import { useConsumer } from '../core';
import { MediaStreamArc } from '../core/hooks/shared_device';

export const useConsumerConnectHTMLElement = (consumer: Bluesea.StreamConsumerPair | Bluesea.StreamConsumer) => {
    const element = useMemo(() => new DataContainer<HTMLVideoElement | null>(null), []);
    useEffect(() => {
        if (consumer.stream && element.value) {
            element.value.srcObject = consumer.stream;
        }
        const handler = () => {
            if (element.value) {
                if (consumer.stream && element.value.srcObject !== consumer.stream) {
                    element.value.srcObject = consumer.stream || null;
                }
            }
        }
        consumer.on('state', handler);
        element.addChangeListener(handler);

        return () => {
            consumer.off('state', handler);
            element.removeChangeListener(handler);
            if (element.data) {
                element.data.srcObject = null;
            }
        }
    }, [element, consumer]);

    return useCallback((instance: HTMLVideoElement | null) => {
        if (instance && consumer.stream) {
            instance.srcObject = consumer.stream;
        }
        element.change(instance);
    }, [element])
}

export const useStreamConnectHTMLElement = (stream?: MediaStream2) => {
    const element = useMemo(() => new DataContainer<HTMLVideoElement | null>(null), []);
    useEffect(() => {
        if (stream) {
            const handler = () => {
                if (element.value) {
                    if (element.value.srcObject !== stream) {
                        element.value.srcObject = stream || null;
                    }
                }
            }
            element.addChangeListener(handler);
            return () => {
                element.removeChangeListener(handler);
                if (element.data) {
                    element.data.srcObject = null;
                }
            }
        }
    }, [element, stream]);

    return useCallback((instance: HTMLVideoElement | null) => {
        if (instance && stream) {
            instance.srcObject = stream;
        }
        element.change(instance);
    }, [element, stream])
}

export const RemoteViewer = (props: MediaHTMLAttributes<HTMLVideoElement> & { stream: StreamRemote, priority?: number, minSpatial?: number, maxSpatial?: number, minTemporal?: number, maxTemporal?: number }) => {
    const consumer = useConsumer(props.stream, props.priority, props.minSpatial, props.maxSpatial, props.minTemporal, props.maxTemporal);
    const ref = useConsumerConnectHTMLElement(consumer);
    return <video muted autoPlay ref = { ref } {...props }> </video>
}

export const ConsumerViewer = (props: MediaHTMLAttributes<HTMLVideoElement> & { consumer: Bluesea.StreamConsumerPair | Bluesea.StreamConsumer }) => {
    const ref = useConsumerConnectHTMLElement(props.consumer);
    return <video muted autoPlay ref={ref} {...props}> </video>
}

export const LocalViewer = (props: MediaHTMLAttributes<HTMLVideoElement> & { stream: MediaStream2 | MediaStreamArc }) => {
    let ref = useStreamConnectHTMLElement(props.stream instanceof MediaStreamArc ? props.stream.stream : props.stream);
    return (<video muted autoPlay ref = { ref } {...props }> </video>)
}

export const VideoViewer = (props: MediaHTMLAttributes<HTMLVideoElement> & { stream: MediaStream2 | MediaStreamArc | StreamRemote | Bluesea.StreamConsumerPair | Bluesea.StreamConsumer, priority?: number, min_spatial?: number, max_spatial?: number, min_temporal?: number, max_temporal?: number }) => {
    if (props.stream instanceof StreamRemote) {
        return (<RemoteViewer { ...props } stream = { props.stream }/>)
    } else if (props.stream instanceof Bluesea.StreamConsumerPair || props.stream instanceof Bluesea.StreamConsumer ) {
        return (<ConsumerViewer {...props} consumer={props.stream}/>)
    } else {
        return (<LocalViewer {...props} stream={props.stream}/>)
    }
}