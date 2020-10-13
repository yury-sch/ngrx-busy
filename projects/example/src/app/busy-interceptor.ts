import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {pushBusy} from '../../../ngrx-busy/src/lib/rx-busy';

@Injectable()
export class BusyInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return pushBusy(next.handle(request));
  }
}
