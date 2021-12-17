import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  HostBinding,
  Inject,
  InjectionToken,
  OnDestroy,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
import {of, Subject} from 'rxjs';
import {delay, takeUntil} from 'rxjs/operators';
import {NgrxSpinner} from './spinner';

const BASE_BACKDROP = true;
// const BASE_DELAY = 0;
// const BASE_MIN_DURATION = 0;
const BASE_TEMPLATE = NgrxSpinner;

/** Default `ngrx-busy` options that can be overridden. */
export interface NgrxBusyDefaultOptions {
  /** A faded backdrop will be shown behind the indicator if true. */
  backdrop?: boolean;
  // /** The amount of time to wait until showing the indicator. Specified in milliseconds. */
  // delay?: number;
  // /** The amount of time to keep the indicator showing even if the busy thing was completed quicker. Specified in milliseconds. */
  // minDuration?: number;
  /**
   * The template can be a template or a component.
   * If provided, the custom template will be shown in place of the default indicator template.
   */
  template?: Type<any>;
}

/** Injection token to be used to override the default options for `ngrx-busy`. */
export const NGRX_BUSY_DEFAULT_OPTIONS =
  new InjectionToken<NgrxBusyDefaultOptions>('ngrx-busy-default-options', {
    providedIn: 'root',
    factory: NGRX_BUSY_DEFAULT_OPTIONS_FACTORY,
  });

export function NGRX_BUSY_DEFAULT_OPTIONS_FACTORY(): NgrxBusyDefaultOptions {
  return {backdrop: BASE_BACKDROP, /*delay: BASE_DELAY, minDuration: BASE_MIN_DURATION,*/ template: BASE_TEMPLATE};
}

@Component({
  selector: 'ngrx-busy, [ngrx-busy]',
  templateUrl: './busy.html',
  styleUrls: ['./busy.scss'],
  exportAs: 'ngrxBusy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ngrx-busy-container'
  }
})
export class NgrxBusy implements OnDestroy {

  private readonly unsubscribe$ = new Subject();
  @ViewChild('loader', {read: ViewContainerRef}) loader!: ViewContainerRef;
  @HostBinding('class.ngrx-busy-loading')
  // tslint:disable-next-line:variable-name
  private _loading = false;
  private counter = 0;
  private initialized?: ComponentRef<any>;

  constructor(public elementRef: ElementRef,
              private readonly cdr: ChangeDetectorRef,
              private readonly resolver: ComponentFactoryResolver,
              @Inject(NGRX_BUSY_DEFAULT_OPTIONS) public defaults: NgrxBusyDefaultOptions) {
  }

  public get loading(): boolean {
    // return true;
    return this._loading;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  show(): void {
    if (this.counter === 0) {
      this._loading = true;
      this.cdr.detectChanges();
      const factory = this.resolver.resolveComponentFactory(this.defaults.template || BASE_TEMPLATE);
      this.initialized = this.loader.createComponent(factory);
    }
    this.counter++;
  }

  hide(): void {
    if (!this._loading) { return; }

    of(true).pipe(
      delay(100),
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      this.counter = Math.max(0, this.counter - 1);
      if (this.counter === 0) {
        this._loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
