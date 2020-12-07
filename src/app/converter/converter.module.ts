import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConverterRoutingModule } from './converter-routing.module';
import { AngularMaterialModule } from './../angular-material.module';

import { ConverterComponent } from './converter.component';

@NgModule({
  declarations: [ConverterComponent],
  imports: [
    CommonModule,
    ConverterRoutingModule,
    AngularMaterialModule
  ]
})
export class ConverterModule { }
