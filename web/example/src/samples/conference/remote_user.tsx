import { useMemo } from 'react';
import { StreamKinds, StreamRemote, useAudioLevelMix, usePeerActiveRemoteStreams, usePeerRemoteStream, useRemoteStreamQuality, VideoViewer } from 'bluesea-media-react-sdk';

export const RemoteUser = (props: { peer: string, priority?: number }) => {
    const audio_level = useAudioLevelMix(props.peer, 'audio_main');
    const audio_stream = usePeerRemoteStream(props.peer, 'audio_main');
    const audio_quality = useRemoteStreamQuality(audio_stream);
    const video_streams = usePeerActiveRemoteStreams(props.peer, StreamKinds.VIDEO);

    const webcam = useMemo<StreamRemote | undefined>(() => {
        return video_streams[0];
    }, [video_streams]);

    const screen = useMemo<StreamRemote | undefined>(() => {
        return video_streams[0];
    }, [video_streams]);

    return (<div className='w-full h-full'>
        {webcam && <VideoViewer stream={webcam} priority={props.priority}/>}
        <div>{webcam?.peer_id} {props.peer}: {audio_level} Quality: {audio_quality?.mos}</div>
    </div>)
}