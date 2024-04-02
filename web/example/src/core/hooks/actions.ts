import { useContext, useMemo } from "react";
import { BlueseaSessionContext } from "../components/provider";

interface Actions {
    connect: () => Promise<void>;
    restartIce: () => Promise<void>;
    disconnect: () => void;
    playAudioMix: () => void;
}

export const useActions = (): Actions => {
    const { data } = useContext(BlueseaSessionContext);
    return useMemo(() => {
        return {
            connect: data.connect,
            restartIce: data.restart_ice,
            disconnect: data.disconnect,
            playAudioMix: () => {
                data?.session.getMixMinusAudio()?.play();
            }
        }
    }, [data]);
}