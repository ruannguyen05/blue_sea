import { useSession, useSharedData, usePeers, useRoomStats } from 'bluesea-media-react-sdk';
import { MAIN_PREVIEW_USER } from './const';
import { LocalUser } from './local_user';
import { RemoteUser } from './remote_user';

const RoomStats = () => {
    const stats = useRoomStats()
    return <div>Users: {stats.peers}</div>
}

export const SideVideos = () => {
    const session = useSession();
    const [main_user, setMainUser] = useSharedData<string | undefined>(MAIN_PREVIEW_USER, undefined);
    const peers = usePeers();

    return (
        <div className='w-[200px] h-full'>
            <RoomStats/>
            {peers.map((peer_id) => <div
                key={peer_id}
                onClick={() => {
                    setMainUser(peer_id)
                }}>
                {session.peer_id === peer_id ? <LocalUser/> : <RemoteUser peer={peer_id}/>}
            </div>)}
        </div>
    )
}