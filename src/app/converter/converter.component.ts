import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { createFFmpeg, fetchFile, FFmpeg } from '@ffmpeg/ffmpeg';

@Component({
  selector: 'app-converter',
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.scss']
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
  private videoLength: number;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.ffmpeg = createFFmpeg({ logger: this.ffmpegLogger });
    this.load();
  }

  /** Get the video file from the input and extract the required data */
  setVideo(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || !input.files.length || input.files.item(0) === this.video) {
      return;
    }

    this.gifURL = null;
    this.videoLength = null;
    this.video = input.files.item(0);
    this.videoURL = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(this.video));
    this.setGifFilename(this.video.name);
  }

  /** Convert the video file to a gif */
  // Documentation:
  // https://medium.com/@colten_jackson/doing-the-gif-thing-on-debian-82b9760a8483
  // http://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html
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
        '-i', 'video',
        '-vf', 'fps=15,scale=600:-1:flags=lanczos,palettegen',
        'palette.png'
      );

      this.progressBarMode = 'determinate';
      this.progressBarValue = 0;
      this.progressMessage = 'Converting to gif';

      // Convert the video to a gif using the custom palette
      await this.ffmpeg.run(
        '-i', 'video',
        '-i', 'palette.png',
        '-filter_complex', 'fps=15,scale=600:-1:flags=lanczos[x];[x] [1:v]paletteuse',
        'out.gif'
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

  /** Use the logger to get data about the current conversion */
  private ffmpegLogger = ({ message }: { type: string, message: string }) => {
    // console.log('LOG', message);

    // Get the length of the video
    if (!this.videoLength) {
      // Format is "Duration: hh:mm:ss.ms,"
      if (message.includes('Duration: ')) {
        const begin = message.indexOf(':') + 2; // +2 to remove : and space
        const end = message.indexOf(',');
        const time = message.slice(begin, end); // hh:mm:ss.ms
        this.videoLength = this.toSeconds(time);
      }
    }

    // Update the progress bar
    if (this.conversionInProgress && this.progressBarMode === 'determinate') {
      if (message.includes('time=')) {
        const begin = message.indexOf('time=') + 5; // +1 to remove "time="
        const end = message.indexOf('bitrate') - 1; // -1 to remove preceeding space
        const time = message.slice(begin, end);
        this.progressBarValue = this.toSeconds(time) / this.videoLength * 100;
      }
    }
  }

  /** Converts a time from hh:mm:ss format to seconds */
  private toSeconds(time: string) {
    const arr = (time.split(':')).map((str) => Number(str));
    return arr[0] * 3600 + arr[1] * 60 + arr[2] * 1;
  }
}
