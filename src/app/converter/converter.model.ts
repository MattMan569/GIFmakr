/** Metadata retrieved from the video file */
export interface VideoMetadata {
  /** Duration of the video in seconds */
  videoDuration: number;

  /** The video's frames per second */
  videoFrameRate: number;

  /** Height of the video in pixels */
  videoHeight: number;

  /** Width of the video in pixels */
  videoWidth: number;
}

/** Data used  */
export interface ConfigData extends VideoMetadata {
  /** Time in seconds to start the gif from */
  gifStart: number;

  /** Time in seconds to end the gif at */
  gifDuration: number;

  /** The gif's frames per second */
  gifFrameRate: number;

  /** Maintain the same aspect ratio as the video */
  maintainAspectRatio: boolean;

  /** Height of the gif in pixels */
  gifHeight: number;

  /** Width of the gif in pixels */
  gifWidth: number;

  /** Is looping enabled on the gif */
  enableLooping: boolean;
}
