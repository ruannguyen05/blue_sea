import { useCallback, useEffect, useState } from 'react';
import { StreamKinds, VideoViewer, useConsumerPair, usePublisher, useSharedUserMedia } from 'bluesea-media-react-sdk';
import { useCameraState } from './const';

const MicToggle = () => {
    const [stream, err, streamChanger] = useSharedUserMedia("main-mic");
    const [enable, setEnable] = useState(!!stream);
    const publisher = usePublisher({ kind: StreamKinds.AUDIO, name: 'audio_main' })
    console.log(stream, enable);

    useEffect(() => {
        if (stream) {
            console.log("switch audio stream");
            publisher.switchStream(stream);
            return () => {
                publisher.switchStream(null);
            }
        }
    }, [stream]);

    const toggle = useCallback(() => {
        let new_enable = !enable;
        if(new_enable) {
            if (!stream) {
                streamChanger({ audio: true });
            } else {
                publisher.switchStream(stream);
            }
        } else {
            publisher.switchStream(null);
        }
        setEnable(new_enable);
    }, [stream, enable, setEnable, streamChanger]);

    return <div onClick={toggle}>{enable ? 'Unshare mic' : 'Share mic'}</div>
}

const WebcamToggle = () => {
    const [stream, err, streamChanger] = useSharedUserMedia("main-camera");
    let [cam_device,] = useCameraState("");
    const [enable, setEnable] = useState(!!stream);
    const publisher = usePublisher({ kind: StreamKinds.VIDEO, name: 'video_main', simulcast: true })

    console.log(stream, enable);

    useEffect(() => {
        if (stream) {
            console.log("switch video stream");
            publisher.switchStream(stream);
            return () => {
                publisher.switchStream(null);
            }
        }
    }, [stream]);

    const toggle = useCallback(() => {
        let new_enable = !enable;
        streamChanger(new_enable ? { video: { deviceId: cam_device } } : undefined);
        setEnable(new_enable);
    }, [cam_device, enable, setEnable,, streamChanger]);

    return <div onClick={toggle}>{enable ? 'Unshare webcam' : 'Share webcam'}</div>
}


export const MediaControls = () => {
    return (
        <div className='flex flex-row space-x-2 justify-center'>
            <MicToggle/>
            <WebcamToggle/>
            <div onClick={() => {
                window.location.href = "/"
            }}>Exit</div>
        </div>
    )
}