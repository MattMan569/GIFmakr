import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { createFFmpeg, fetchFile, FFmpeg } from '@ffmpeg/ffmpeg';
import MediaInfoFactory from 'mediainfo.js';
import { GetSizeFunc, MediaInfo, ReadChunkFunc } from 'mediainfo.js/dist/types';

import { ConverterConfigComponent } from './converter-config/converter-config.component';
import { VideoMetadata, ConfigData } from './converter.model';

@Component({
  selector: 'app-converter',
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.scss'],
})
export class ConverterComponent implements OnInit {
  ffmpegLoaded = false;
  ffmpegError: string;
  video: File;
  videoURL: SafeUrl;
  conversionInProgress = false;
  gifURL: SafeUrl;
  gifFilename: string;
  progressBarMode: 'determinate' | 'indeterminate';
  progressBarValue: number;
  progressMessage: string;
  private ffmpeg: FFmpeg;
  private videoMetadata: VideoMetadata;
  private config: ConfigData;

  constructor(private sanitizer: DomSanitizer, private dialog: MatDialog) { }

  ngOnInit() {
    this.ffmpeg = createFFmpeg({ progress: this.ffmpegProgress });
    this.load();
    this.videoMetadata = {} as VideoMetadata;
  }

  /** Get the video file from the input and extract the required data */
  async setVideo(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || !input.files.length || input.files.item(0) === this.video) {
      return;
    }

    this.gifURL = null;
    this.video = input.files.item(0);

    try {
      this.videoMetadata = await this.getMetadata(await MediaInfoFactory({ format: 'object' }));
    } catch (error) {
      console.warn('Unable to get video metadata\n', error);
    }

    this.config = {
      ...this.videoMetadata,
      gifStart: 0,
      gifDuration: this.videoMetadata.videoDuration,
      gifFrameRate: this.videoMetadata.videoFrameRate,
      maintainAspectRatio: true,
      gifHeight: this.videoMetadata.videoHeight,
      gifWidth: this.videoMetadata.videoWidth,
      enableLooping: true,
    };
    this.videoURL = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(this.video));
    this.setGifFilename(this.video.name);
  }

  openConfigDialog() {
    const dialogRef = this.dialog.open(ConverterConfigComponent, { data: this.config });

    dialogRef.afterClosed().subscribe((result: ConfigData) => {
      if (!result) {
        return;
      }

      this.config = result;
    });
  }

  /** Convert the video file to a gif */
  // Documentation:
  // https://medium.com/@colten_jackson/doing-the-gif-thing-on-debian-82b9760a8483
  // http://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html
  // https://superuser.com/questions/556029/how-do-i-convert-a-video-to-gif-using-ffmpeg-with-reasonable-quality
  // https://superuser.com/a/1323430
  async convertToGif() {
    if (!this.video) {
      alert('Please upload a video file');
      return;
    }

    try {
      this.conversionInProgress = true;
      this.ffmpeg.FS('writeFile', 'video', await fetchFile(this.video));

      this.progressBarMode = 'indeterminate';
      this.progressMessage = 'Creating palette';

      // Generate the custom palette
      // Required for decent quality gifs
      await this.ffmpeg.run(
        '-ss', `${this.config.gifStart}`,
        '-t', `${this.config.gifDuration}`,
        '-i', 'video',
        '-vf', `fps=${this.config.gifFrameRate},scale=600:-1:flags=lanczos,palettegen`,
        'palette.png',
      );

      this.progressBarMode = 'determinate';
      this.progressBarValue = 0;
      this.progressMessage = 'Converting to gif';

      // Convert the video to a gif using the custom palette
      await this.ffmpeg.run(
        '-ss', `${this.config.gifStart}`,
        '-t', `${this.config.gifDuration}`,
        '-i', 'video',
        '-i', 'palette.png',
        '-filter_complex', `fps=${this.config.gifFrameRate},scale=${this.config.gifWidth}:${this.config.gifHeight}:flags=lanczos[x];[x] [1:v]paletteuse`,
        '-loop', `${this.config.enableLooping ? 0 : -1}`,
        'out.gif',
      );

      const data = this.ffmpeg.FS('readFile', 'out.gif');
      this.gifURL = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(new Blob([data.buffer], {
        type: 'image/gif',
      })));

      this.conversionInProgress = false;
    } catch (error) {
      console.error(error);
      this.conversionInProgress = false;
    }
  }

  /** Load ffmpeg.wasm */
  private async load() {
    try {
      await this.ffmpeg.load();
      this.ffmpegLoaded = true;
    } catch (error) {
      this.ffmpegError = error;
      console.error('[FFmpeg load error]', error);
    }
  }

  /** Set the gif filename to the input name with the extension changed to .gif */
  private setGifFilename(inputFilename: string) {
    const pos = inputFilename.lastIndexOf('.') || inputFilename.length;
    this.gifFilename = inputFilename.substr(0, pos) + '.gif';
  }

  /** Update the progress bar with ffmpeg's progress on the current conversion */
  private ffmpegProgress = ({ ratio }: { ratio: number }) => {
    if (this.progressBarMode === 'determinate') {
      // FFmpeg bug
      // Ratio is sometimes reported as -721266825.4270834
      this.progressBarValue = ratio < 0 ? 0 : ratio * 100;
    }
  }

  /** Get the metadata from the uploaded video using mediainfo.js */
  private async getMetadata(mediaInfo: MediaInfo) {
    // Setup the required callbacks
    const getSize: GetSizeFunc = () => this.video.size;
    const readChunk: ReadChunkFunc = (chunkSize, offset) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
          if (event.target.error) {
            reject(event.target.error);
          }
          resolve(new Uint8Array(event.target.result as ArrayBuffer));
        };
        reader.readAsArrayBuffer(this.video.slice(offset, offset + chunkSize));
      });
    };

    // Get the metadata
    const result = await mediaInfo.analyzeData(getSize, readChunk) as any;
    if (!result) {
      throw new Error();
    }

    return {
      videoDuration: this.videoMetadata.videoDuration = Number(result.media.track[0].Duration),
      videoFrameRate: this.videoMetadata.videoFrameRate = Number(result.media.track[0].FrameRate),
      videoHeight: this.videoMetadata.videoHeight = Number(result.media.track[1].Height),
      videoWidth: this.videoMetadata.videoWidth = Number(result.media.track[1].Width),
    } as VideoMetadata;
  }
}
