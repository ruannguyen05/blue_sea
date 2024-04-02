import * as React from "react";
import { BlueseaSessionProvider, MixMinusMode, useActions, useSession, useSharedUserMedia, useSharedData, usePeers } from "bluesea-media-react-sdk";
import { MAIN_CAMERA, MAIN_MIC, MAIN_PREVIEW_USER } from "./const";
import { Header } from "./header";
import { MainUser } from "./main_user";
import { MediaControls } from "./media_controls";
import { Preview } from "./preview";
import { SideVideos } from "./side_users";

const url = "https://gateway.bluesea.live";
const token = "eyJkIjoie1wiZFwiOntcImluZm9cIjp7XCJiaWxsaW5nXCI6e1wic2VydmljZV9pZFwiOjEwMCxcInNpZ25hdHVyZVwiOlwiQUVZQUFBQUFBQUFBTUVRQ0lHQldRZUdSYWdTSEVaQkRkMVdpOXp0emRJRmlkd0gwVEdPZFllWm1BQ1ptQWlCSlJfanNTYkFVcmRIaWN6cE1zZ284bnpVcm1uTzlVUTlKa1FmYXhmNG55Zz09XCJ9LFwiY29uc3VtZXJfcm9vdF9wdWJcIjpcInhwdWI2NjFNeU13QXFSYmNGMURLSHdaOFVTZ2lRM3hIeGpqVU44VHNZVTVHaXM5N25IdzNwYzhVbUZiZzd1dlppUUZaYmhzdDdrV01HZWhUQXZmNXI2emM2b29xVTFzNHI4OGpOTW0xN0dvV3NTelwiLFwiY3JlYXRlZF9hdF91c1wiOjE3MTE5NDA1NTg3MTM1MTAsXCJpZGVudGl0eVwiOntcImFwcFwiOlwiY2x0bzBjaHJ3MDAwaXpxMDFnYjJzYnB2ZVwiLFwib3JnXCI6XCJjbHRud3UwbTYwMDBmenEwMWJoOGVqaWZwXCIsXCJwZWVyXCI6XCJ1c2VyMlwiLFwicm9vbVwiOlwicm9vbTEyM1wiLFwic2Vzc2lvbl9jaGlsZF9pZFwiOjIwODM5MjQzOTd9LFwibG9nXCI6e1wiZXZlbnRcIjp7XCJzZXJ2aWNlX2lkXCI6MTAwLFwic2lnbmF0dXJlXCI6XCJBRVlBQUFBQUFBQUFNRVFDSUY2ZFdXb1lEeXd1b3NndjlmYjktc0k1YjFzUkh1cm14SVp0bVVJNmhJeWZBaUI4aENfdXQ4NUtaMS00cHFvSXhlc0RjZ0lEMm1xMHE5cER4VENHbkxrYUN3PT1cIn0sXCJzdGF0c1wiOm51bGx9LFwicmVjb3JkXCI6bnVsbCxcInNlc3Npb25fY2hpbGRfaWRcIjoyMDgzOTI0Mzk3LFwic3RyZWFtXCI6e1wiYXVkaW9fbWl4ZXJcIjpmYWxzZSxcIm1heF9iaXRyYXRlXCI6MzAwMDAwMCxcInBsYW5faWRcIjpcIm1lZGl1bVwiLFwidmlkZW9fZW5hYmxlXCI6dHJ1ZX19LFwia2V5XCI6XCJ4cHJ2OXhQcWFRRmI2cEd3M3c1aGNnWU5QeGhNaFNkd3N5blNxWXd4M3BWeHc4VkFIOFZ5aDFCSHFRazJVRlA4ckdGb0E0WDVwWWIyWVNyQzRZc3BFM1JNOFN1RUZuTHhSQ05xc1Z3UnhyQjhrRndcIn0sXCJlXCI6bnVsbH0iLCJzIjoiMzgxeVhaOUhvN3hZV2pMYVkxek5pV29KbUhNRVlQREdUbmFrcWRHdmJpUkNIZmFkUkhTUzJiOTFSRFpnYzhRR2t3UkhkRnZhRHdwWldNZmJMdXl4QW92R3lGOUxtUko4In0="

const StreamHiddenLogic = () => {
    useSharedUserMedia(MAIN_MIC);
    useSharedUserMedia(MAIN_CAMERA);
    const [main_user, setMainUser] = useSharedData<string | undefined>(MAIN_PREVIEW_USER, undefined);
    const peers = usePeers();

    React.useEffect(() => {
        if ((!main_user || peers.indexOf(main_user) === 0) && peers.length > 0) {
            setMainUser(peers[0]);
        }
    }, [main_user, peers]);

    return <div style={{display: 'none'}}></div>
}

export const ConferenceSampleContainer = () => {
    const session = useSession();
    const actions = useActions();
    const [configing, setConfiging] = React.useState(true);
    


    let join = React.useCallback(async () => {
        console.log("session -",session)
        actions.playAudioMix();
        actions.connect()
            .then(() => {
                console.log("connected");
            })
            .catch((err: any) => {
                console.error("connect error", err);
            })
        setConfiging(false);
    }, []);

    return (

        <div className="w-full h-full">
            {configing ? 
            <div className="flex flex-col justify-center">
                <Preview></Preview>
                <button onClick={join}>Join</button>
            </div> : 
            <div className="w-full h-full">
                <div className="flex flex-col w-full h-full">
                    <Header />
                    <div className="flex flex-row flex-grow flex-grow-col">
                        <div className="flex-grow flex-grow-row">
                            <MainUser></MainUser>
                        </div>
                        <div>
                            <SideVideos></SideVideos>
                        </div>
                    </div>
                    <div className="bg-gray-200">
                        <MediaControls></MediaControls>
                    </div>
                </div>
            </div>}
        </div>
    )
}

export const ConferenceSampleScreen = () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    console.log("check - " + urlSearchParams);
    const params = Object.fromEntries(urlSearchParams.entries());
    const peer_id = React.useMemo(() => params.peer || "test-" + new Date().getTime(), []);

    return (
        <BlueseaSessionProvider
            gateways={params.url || url}
            room={params.room || "room123"}
            peer={"user2"}
            token={params.token || token}
            receivers={{ audio: 1, video: 1 }}
            mixMinusAudio={{ mode: MixMinusMode.AllAudioStreams }}
        >
            <StreamHiddenLogic />
            <ConferenceSampleContainer/>
        </BlueseaSessionProvider>
    )
}