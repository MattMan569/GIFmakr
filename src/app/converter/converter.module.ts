import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ConverterRoutingModule } from './converter-routing.module';
import { AngularMaterialModule } from './../angular-material.module';

import { ConverterComponent } from './converter.component';
import { ConverterConfigComponent } from './converter-config/converter-config.component';

@NgModule({
  declarations: [
    ConverterComponent,
    ConverterConfigComponent
  ],
  imports: [
    CommonModule,
    ConverterRoutingModule,
    AngularMaterialModule,
    ReactiveFormsModule
  ]
})
export class ConverterModule { }
