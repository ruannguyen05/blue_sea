import * as React from "react";
import { 
    BlueseaSessionProvider, LogLevel, SenderConfig, 
    StreamConsumerPair, StreamKinds, 
    useAudioLevelConsumer, useConsumerPair, usePublisher, 
    useSharedUserMedia, useConsumerQuality,
    BitrateControlMode, useConsumerState, VideoViewer 
} from "bluesea-media-react-sdk";

const video_and_audio = { audio: true, video: true };
const url = "http://localhost:8001";

const AudioLevelViewer = ( { consumer }: { consumer: StreamConsumerPair }) => {
    console.log("render audio level");
    const [state, ] = useConsumerState(consumer);
    const audio_level = useAudioLevelConsumer(consumer);
    const quality = useConsumerQuality(consumer);
    return <div>Audio_level {audio_level}, state: {state}, qualty: {quality?.mos}</div>
}

const EchoPairSample = ({ peer }: { peer: string }) => {
    const [stream, err, stream_changer] = useSharedUserMedia('main_stream');
    const mic_publisher = usePublisher({ kind: StreamKinds.AUDIO, name: 'audio_main' });
    const camera_publisher = usePublisher({ kind: StreamKinds.VIDEO, name: 'video_main' });
    const consumer = useConsumerPair(peer, "audio_main", "video_main");

    React.useEffect(() => {
        if(stream) {
            console.log("switch stream:", stream);
            mic_publisher.switchStream(stream);
            camera_publisher.switchStream(stream);

            return () => {
                mic_publisher.switchStream(null);
                camera_publisher.switchStream(null);
            }
        }
    }, [stream]);

    React.useEffect(() => {
        stream_changer(video_and_audio);
    }, []);

    return (
        <div>
            <AudioLevelViewer consumer={consumer}/>
            <VideoViewer stream={consumer}/>
        </div>
    )
}

export const EchoPairScreen = () => {
    const [enable, setEnable] = React.useState(false)
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const senders = React.useMemo<SenderConfig[]>(() => {
        return [
            { kind: StreamKinds.AUDIO, name: 'audio_main' },
            { kind: StreamKinds.VIDEO, name: 'video_main', simulcast: true },
        ]
    }, []);
    const peer = params.peer || "test";

    return <>
        <button onClick={() => setEnable(!enable)}>Toggle</button>
        {enable && <BlueseaSessionProvider
            logLevel={LogLevel.INFO}
            onConnectError={console.error}
            gateways={params.server || url}
            bitrateControlMode={BitrateControlMode.MaxBitrateOnly}
            room={params.room || "test"}
            peer={peer}
            token={params.token || "test"}
            senders={senders}
        >
            <EchoPairSample peer={peer} />
        </BlueseaSessionProvider>}
    </>
}