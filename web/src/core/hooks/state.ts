import { useContext } from "react";
import { BlueseaSessionContext, BlueseaSessionState } from "../components/provider";
import { useReactionData } from "./reaction";

export const useSessionState = (): BlueseaSessionState => {
    const { data } = useContext(BlueseaSessionContext);
    return useReactionData(data.state);
}