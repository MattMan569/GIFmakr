import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConverterComponent } from './converter.component';

const routes: Routes = [{ path: '', component: ConverterComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConverterRoutingModule { }
