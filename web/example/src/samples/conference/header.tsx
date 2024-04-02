import { useSessionState } from "bluesea-media-react-sdk"

export const Header = () => {
    let state = useSessionState()
    return <div className="bg-gray-200">Connection: {state}</div>
}