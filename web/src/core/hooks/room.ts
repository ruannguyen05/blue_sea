import type { RoomStats } from "bluesea-media-js-sdk";
import { useContext } from "react";
import { BlueseaSessionContext } from "../components";
import { useReactionData } from "./reaction";

export const useRoomStats = (): RoomStats => {
    const { data } = useContext(BlueseaSessionContext);
    return useReactionData(data.room_stats);
}