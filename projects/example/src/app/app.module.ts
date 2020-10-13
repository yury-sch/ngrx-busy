import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {NgrxBusyModule} from '../../../ngrx-busy/src/lib/busy.module';
import {BusyInterceptor} from './busy-interceptor';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NgrxBusyModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: BusyInterceptor,
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
