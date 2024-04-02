import { useSession, useSharedData } from 'bluesea-media-react-sdk';
import { MAIN_PREVIEW_USER } from './const';
import { LocalUser } from './local_user';
import { RemoteUser } from './remote_user';

export const MainUser = () => {
    const session = useSession();
    const [main_user,] = useSharedData<string | undefined>(MAIN_PREVIEW_USER, undefined);

    return (
        <div className='w-full h-full'>
            {main_user ? 
                session.peer_id === main_user ? <LocalUser /> : <RemoteUser peer={main_user} priority={500} /> 
             : <div>Please select a stream as main</div>}
        </div>
    )
}