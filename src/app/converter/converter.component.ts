import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

@Component({
  selector: 'app-converter',
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.scss']
})
export class ConverterComponent {
  ffmpegLoaded = false;
  conversionInProgress = false;
  video: File;
  videoURL: SafeUrl;
  gifURL: SafeUrl;
  gifFilename: string;
  private ffmpeg = createFFmpeg({ log: true });

  constructor(private sanitizer: DomSanitizer) {
    this.load();
  }

  /** Get the video file from the input and extract the required data */
  setVideo(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || !input.files.length || input.files.item(0) === this.video) {
      return;
    }

    this.gifURL = null;
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

    this.conversionInProgress = true;

    try {
      this.ffmpeg.FS('writeFile', 'video', await fetchFile(this.video));

      // Generate the custom palette
      // Required for decent quality gifs
      await this.ffmpeg.run(
        '-i', 'video',
        '-vf', 'fps=15,scale=600:-1:flags=lanczos,palettegen',
        'palette.png'
      );

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
    await this.ffmpeg.load();
    this.ffmpegLoaded = true;
  }

  /** Set the gif filename to the input name with the extension changed to .gif */
  private setGifFilename(inputFilename: string) {
    const pos = inputFilename.lastIndexOf('.') || inputFilename.length;
    this.gifFilename = inputFilename.substr(0, pos) + '.gif';
  }
}
