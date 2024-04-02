import { useContext } from "react";
import { BlueseaSessionContext } from "../components/provider";
import type * as Bluesea from 'bluesea-media-js-sdk';

export const useSession = (): Bluesea.BlueSeaSession => {
    const { data } = useContext(BlueseaSessionContext);
    return data.session;
}