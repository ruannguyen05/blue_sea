import { useEffect, useState } from "react";
import { MediaStream2, mediaDevices, MediaDeviceKind, MediaDeviceInfo, MediaStreamConstraints } from "../../platform/device";

interface Return {
    media?: MediaStream2,
    error?: Error, 
}

export const useDevices = (kind: MediaDeviceKind): [MediaDeviceInfo[], any | null] => {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [error, setError] = useState(null);
    useEffect(() => {
        mediaDevices.enumerateDevices().then((devices: any) => {
            setDevices(devices.filter((d: MediaDeviceInfo) => d.kind === kind).map((d: MediaDeviceInfo) => {
                if(d.deviceId === '') {
                    return {
                        deviceId: 'default',
                        label: 'Default',
                        groupId: d.groupId,
                        kind: d.kind,
                    } as any
                } else {
                    return d
                }
            }));
        }).catch((error: any) => {
            setDevices([]);
            setError(error);
        });
    }, [kind]);

    return [devices, error];
}


export const useUserMedia = (constraints?: MediaStreamConstraints, active?: boolean): [MediaStream2 | undefined, Error | undefined]  => {
    const [res, setRes] = useState({} as Return);
    useEffect(() => {
        if(active) {
            let got_stream: MediaStream2 | undefined;
            mediaDevices.getUserMedia(constraints).then((stream) => {
                got_stream = stream;
                setRes({ media: stream });
            }).catch((err) => {
                got_stream = undefined;
                setRes({ error: err });
            });
            return () => {
                setRes({ media: undefined, error: undefined });
                got_stream?.getTracks().forEach((track) => {
                    track.stop();
                });
            }
        } else {
            return () => {

            }
        }
    }, [JSON.stringify(constraints), active]);
    return [res.media, res.error]
}

export const useDisplayMedia = (constraints?: any, active?: boolean): [MediaStream2 | undefined, Error | undefined]  => {
    const [res, setRes] = useState({} as Return);
    useEffect(() => {
        if(active) {
            let got_stream: MediaStream2 | undefined;
            mediaDevices.getDisplayMedia(constraints).then((stream) => {
                got_stream = stream;
                setRes({ media: stream });
            }).catch((err) => {
                got_stream = undefined;
                setRes({ error: err });
            });
            return () => {
                setRes({ media: undefined, error: undefined });
                got_stream?.getTracks().forEach((track) => {
                    track.stop();
                });
            }
        } else {
            return () => {

            }
        }
    }, [JSON.stringify(constraints), active]);
    return [res.media, res.error]
}