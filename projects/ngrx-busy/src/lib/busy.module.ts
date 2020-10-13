import {InjectionToken, ModuleWithProviders, NgModule} from '@angular/core';
import {NgrxBusy} from './busy';
import {CommonModule} from '@angular/common';
import {NgrxSpinner} from './spinner';


@NgModule({
  declarations: [NgrxBusy, NgrxSpinner],
  imports: [
    CommonModule
  ],
  exports: [NgrxBusy]
})
export class NgrxBusyModule {
  // static forRoot(): ModuleWithProviders<NgrxBusyModule> {
  //   return {
  //     ngModule: NgrxBusyModule,
  //     // providers: [SideNavService]
  //   };
  // }
}

