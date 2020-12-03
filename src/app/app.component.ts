import { Component } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  ffmpegLoaded = false;
  videoURL: SafeUrl;
  gifURL: SafeUrl;
  video: File;
  private ffmpeg = createFFmpeg({ log: true });

  constructor(private sanitizer: DomSanitizer) {
    this.load();
  }

  setVideo(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || !input.files.length || input.files.item(0) === this.video) {
      return;
    }

    this.gifURL = null;
    this.video = input.files.item(0);
    this.videoURL = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(this.video));
  }

  // Convert the video file to a gif
  // Documentation:
  // https://medium.com/@colten_jackson/doing-the-gif-thing-on-debian-82b9760a8483
  // http://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html
  convertToGif = async () => {
    if (!this.video) {
      alert('Please upload a video file');
      return;
    }

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
  }

  private load = async () => {
    await this.ffmpeg.load();
    this.ffmpegLoaded = true;
  }
}
