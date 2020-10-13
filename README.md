**NgrxBusy** can show busy/loading indicators with Cold **or Hot** observable streams.

## Getting Started

Import the `NgrxBusyModule` in your root application module:

```ts
import {NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgrxBusyModule} from 'ngrx-busy';

@NgModule({
  imports: [
    ...
    NgrxBusyModule
  ]
})
export class AppModule {
}
```

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

Reference to `ngrxBusy` directive with `withBusy` operator:

```ts
import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {withBusy} from 'ngrx-busy';

@Component({
  selector: 'some',
  template: `
        <ngrx-busy>...content</ngrx-busy>
    `
})
class SomeComponent implements OnInit {
  @ViewChild(NgrxBusy) busy: NgrxBusy;

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.http.get('...').pipe(withBusy(() => this.busy)).subscribe();
  }
}
```

## Overriding Defaults

The default values of options can be overriden by configuring the provider of the `BusyModule`.

In the root application module, you can do this:

```ts
import {NgModule} from '@angular/core';
import {NgBusyModule, BusyConfig} from 'ng-busy';
import {CustomBusySpinner} from '...'

@NgModule({
  imports: [
    NgBusyModule
  ],
  providers: [
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
export class AppModule
```
