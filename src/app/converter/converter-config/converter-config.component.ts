import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ConfigData } from './../converter.model';

@Component({
  selector: 'app-converter-config',
  templateUrl: './converter-config.component.html',
  styleUrls: ['./converter-config.component.scss'],
})
export class ConverterConfigComponent implements OnInit {
  form: FormGroup;
  private initialAspectRatio: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public input: ConfigData,
    private dialogRef: MatDialogRef<ConverterConfigComponent>,
  ) { }

  ngOnInit(): void {
    this.initialAspectRatio = this.input.videoWidth / this.input.videoHeight;

    this.form = new FormGroup({
      gifStart: new FormControl(
        this.input.gifStart,
        {
          validators: [
            Validators.required,
            Validators.max(this.input.videoDuration),
            Validators.min(0),
          ],
        },
      ),
      gifDuration: new FormControl(
        this.input.gifDuration,
        {
          validators: [
            Validators.required,
            Validators.max(this.input.videoDuration),
            Validators.min(0),
          ],
        },
      ),
      gifFrameRate: new FormControl(
        this.input.gifFrameRate,
        {
          validators: [
            Validators.required,
            Validators.max(this.input.videoFrameRate),
            Validators.min(1),
          ],
        },
      ),
      maintainAspectRatio: new FormControl(this.input.maintainAspectRatio),
      gifWidth: new FormControl(
        this.input.gifWidth,
        {
          validators: [
            Validators.required,
            Validators.min(1),
          ],
        },
      ),
      gifHeight: new FormControl(
        this.input.gifHeight,
        {
          validators: [
            Validators.required,
            Validators.min(1),
          ],
        },
      ),
      enableLooping: new FormControl(this.input.enableLooping),
    });
  }

  /**
   * Validate that the gif start time does not go out of bounds
   * or conflict with other config values
   */
  validateGifStartTime() {
    const gifStart = this.form.controls.gifStart;

    // Start time exceeds video duration
    if (gifStart.value > this.input.videoDuration) {
      gifStart.patchValue(this.input.videoDuration);
      gifStart.updateValueAndValidity();
    } else if (gifStart.value < 0) {
      gifStart.patchValue(0);
      gifStart.updateValueAndValidity();
      return; // Does not affect duration value
    }

    // Gif duration value must be revalidated
    this.validateGifDuration();
  }

  /**
   * Validate that the gif duration does not go out of bounds
   * or conflict with other config values
   */
  validateGifDuration() {
    const gifDuration = this.form.controls.gifDuration;
    const gifStart = this.form.controls.gifStart;

    // Gif duration exceeds video duration minus selected start time
    if (gifDuration.value > this.input.videoDuration - gifStart.value) {
      gifDuration.patchValue(this.input.videoDuration - gifStart.value);
      gifDuration.updateValueAndValidity();
    } else if (gifDuration.value < 0) {
      gifDuration.patchValue(0);
      gifDuration.updateValueAndValidity();
    }
  }

  /**
   * Validate that the input framerate does not exceed the frame rate of the source video.
   * While possible, the result
   */
  validateFrameRate() {
    const gifFrameRate = this.form.controls.gifFrameRate;

    if (gifFrameRate.value > this.input.videoFrameRate) {
      gifFrameRate.patchValue(this.input.videoFrameRate);
      gifFrameRate.updateValueAndValidity();
    }
  }

  /**
   * Validate that the aspect ratio of the generated gif is the
   * same as the source video, given the user's chosen dimensions
   */
  validateAspectRatio(event?: Event) {
    // Not maintaining aspect ratio
    if (!this.form.controls.maintainAspectRatio.value) {
      return;
    }

    const gifHeight = this.form.controls.gifHeight;
    const gifWidth = this.form.controls.gifWidth;

    // Maintain aspect ratio turned back on by user,
    // Use the current width value to calculate a value for the height
    if (!event) {
      // height = width / ar
      gifHeight.patchValue(Math.round(gifWidth.value / this.initialAspectRatio));
      gifHeight.updateValueAndValidity();
      return;
    }

    // When height or width are changed, change the
    // other value such that the aspect ratio is maintained
    const input = event.target as HTMLInputElement;
    if (input.id === 'height') {
      // width = height * ar
      gifWidth.patchValue(Math.round(gifHeight.value * this.initialAspectRatio));
      gifWidth.updateValueAndValidity();
    } else {
      // height = width / ar
      gifHeight.patchValue(Math.round(gifWidth.value / this.initialAspectRatio));
      gifHeight.updateValueAndValidity();
    }
  }

  /**
   * Close the dialog and send the form data back to the caller
   */
  onConfigSubmit() {
    console.log(this.form.value);
    // Merge values not on the form into the return value
    this.dialogRef.close({ ...this.input, ...this.form.value });
  }

  /**
   * Close the dialog
   */
  onCancel() {
    this.dialogRef.close();
  }
}
