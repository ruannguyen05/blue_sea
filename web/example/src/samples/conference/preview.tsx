import { ChangeEvent, useCallback, useEffect } from 'react';
import { LocalViewer, useSharedUserMedia, useDevices } from 'bluesea-media-react-sdk';
import { MAIN_CAMERA, MAIN_MIC, useCameraState, useMicState } from './const';

export const Preview = () => {
    let [mic_devices, mic_err] = useDevices('audioinput');
    let [cam_devices, cam_err] = useDevices('videoinput');
    let [mic_device, setMic] = useMicState("");
    let [cam_device, setCam] = useCameraState("");
    let [mic_stream, mic_stream_err, micStreamChanger] = useSharedUserMedia(MAIN_MIC);
    let [webcam_stream, webcam_stream_err, webcamStreamChanger] = useSharedUserMedia(MAIN_CAMERA);

    useEffect(() => {
        if (mic_device === "") {
            micStreamChanger(undefined);
        } else {
            micStreamChanger({ audio: { deviceId: mic_device } });
        }
    }, [mic_device])

    useEffect(() => {
        if (cam_device === "") {
            webcamStreamChanger(undefined);
        } else {
            webcamStreamChanger({ video: { deviceId: cam_device } });
        }
    }, [cam_device])

    let change_mic = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        setMic(event.target.value);
    }, [setMic]);

    let change_camera = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        setCam(event.target.value);
    }, [setCam]);

    console.log(cam_device);

    return (
        <div className='w-full h-full flex flex-row space-x-2 justify-center'>
            <div>
                <div>Select Audio</div>
                <select onChange={change_mic} value={mic_device}>
                    <option key={-1} value={""}>Please choose one option</option>
                    {mic_devices.map((option, index) => {
                        return <option key={index} value={option.deviceId} >
                            {option.label}
                        </option>
                    })}
                </select>
            </div>
            <div>
                <div>Select Video</div>
                <select onChange={change_camera} value={cam_device}>
                    <option key={-1} value={""}>Please choose one option</option>
                    {cam_devices.map((option, index) => {
                        return <option key={index} value={option.deviceId} >
                            {option.label}
                        </option>
                    })}
                </select>
                {webcam_stream && <div className='w-[200px] h-[200px]'><LocalViewer stream={webcam_stream}/></div>}
            </div>
        </div>
    )
}