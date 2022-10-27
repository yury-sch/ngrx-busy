**NgrxBusy** can show busy/loading indicators with Cold **or Hot** observable streams.

[![npm Downloads](https://img.shields.io/npm/dw/ngrx-busy.svg?style=flat&logo=npm)](https://www.npmjs.com/package/ngrx-busy)

![demo](https://raw.githubusercontent.com/YuryScherbakov/ngrx-busy/main/demo.gif)

## Simple usage

Just wrap your awaitable content with `<ngrx-busy>` directive and refer to it with `withBusy` operator:

```ts
import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NgrxBusy, withBusy} from 'ngrx-busy';

@Component({
  selector: 'some',
  template: `
        <ngrx-busy>...content</ngrx-busy>
    `
})
class SomeComponent implements OnInit {
  @ViewChild(NgrxBusy, {static: true}) busy: NgrxBusy;

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.http.get('...').pipe(withBusy(() => this.busy)).subscribe(data => { });
  }
}
```

## Configure

Wrap every http request with busy operator by interceptor:

```ts
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {pushBusy} from 'ngrx-busy';

@Injectable()
export class BusyInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return pushBusy(next.handle(request));
  }
}
```

Import the `NgrxBusyModule` in your root application module and provide `BusyInterceptor`:

```ts
import {NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {NgrxBusyModule} from 'ngrx-busy';

@NgModule({
  imports: [
    HttpClientModule,
    NgrxBusyModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: BusyInterceptor, multi: true},
  ]
})
export class AppModule {
}
```

## Overriding Defaults

The default values of options can be overridden by configuring the provider of the `BusyModule`.

You can do this in the root application module:

```ts
import {NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {NgrxBusyModule} from 'ngrx-busy';
import {CustomBusySpinner} from '...'

@NgModule({
  imports: [
    HttpClientModule,
    NgrxBusyModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: BusyInterceptor, multi: true},
    {
      provide: NGRX_BUSY_DEFAULT_OPTIONS,
      useValue: {
        backdrop: false,
        template: CustomBusySpinner
      }
    }
  ],
  entryComponents: [
    CustomBusySpinner
  ]
})
export class AppModule {
}
```
