import { SenderConfig, StreamKinds } from "bluesea-media-js-sdk";
import createPersistedState from "use-persisted-state";

export const useMicState = createPersistedState<string>("mic-device");
export const useCameraState = createPersistedState<string>("camera-device");
export const MAIN_MIC = "main-mic";
export const MAIN_CAMERA = "main-camera";
export const MAIN_PREVIEW_USER = "main-preview-user";

export const AUDIO_MAIN = 'audio_main';
export const VIDEO_MAIN = 'video_main';
export const VIDEO_SCREEN = 'video_screen';

export const audio_publisher_config: SenderConfig = {
    name: AUDIO_MAIN,
    kind: StreamKinds.AUDIO
};

export const video_publisher_config: SenderConfig = {
    name: VIDEO_MAIN,
    kind: StreamKinds.VIDEO,
    simulcast: true,
};

export const screen_publisher_config: SenderConfig = {
    name: VIDEO_SCREEN,
    kind: StreamKinds.VIDEO,
    simulcast: true,
};