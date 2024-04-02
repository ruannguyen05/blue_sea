import { usePublisher, usePublisherState, VideoViewer } from 'bluesea-media-react-sdk';
import { video_publisher_config } from './const';

export const LocalUser = () => {
    const webcam_producer = usePublisher(video_publisher_config);
    const [webcam_state, webcam_stream] = usePublisherState(webcam_producer);

    return (<div className='w-full h-full'>
        {webcam_stream && <VideoViewer stream={webcam_stream}/>}
        {!webcam_stream && <div></div>}
    </div>)
}