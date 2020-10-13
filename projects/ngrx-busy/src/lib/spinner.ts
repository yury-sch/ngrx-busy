import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input, OnDestroy,
  OnInit,
  Optional,
  PLATFORM_ID,
  ViewEncapsulation
} from '@angular/core';
import {DOCUMENT, isPlatformBrowser} from '@angular/common';
import {interval, Subject} from 'rxjs';
import {distinctUntilChanged, filter, map, startWith, takeUntil, tap} from 'rxjs/operators';

const BASE_SIZE = 100;
const BASE_STROKE_WIDTH = 10;

let shadowDomIsSupported: boolean;

function _getShadowRoot(element: HTMLElement): Node | null {
  if (shadowDomIsSupported == null) {
    const head = typeof document !== 'undefined' ? document.head : null;
    shadowDomIsSupported = !!(head && ((head as any).createShadowRoot || head.attachShadow));
  }

  if (shadowDomIsSupported) {
    const rootNode = element.getRootNode ? element.getRootNode() : null;

    // Note that this should be caught by `_supportsShadowDom`, but some
    // teams have been able to hit this code path on unsupported browsers.
    if (typeof ShadowRoot !== 'undefined' && ShadowRoot && rootNode instanceof ShadowRoot) {
      return rootNode;
    }
  }

  return null;
}

const INDETERMINATE_ANIMATION_TEMPLATE = `
 @keyframes ngrx-progress-spinner-stroke-rotate-DIAMETER {
    0%      { stroke-dashoffset: START_VALUE;  transform: rotate(0); }
    12.5%   { stroke-dashoffset: END_VALUE;    transform: rotate(0); }
    12.5001%  { stroke-dashoffset: END_VALUE;    transform: rotateX(180deg) rotate(72.5deg); }
    25%     { stroke-dashoffset: START_VALUE;  transform: rotateX(180deg) rotate(72.5deg); }
    25.0001%   { stroke-dashoffset: START_VALUE;  transform: rotate(270deg); }
    37.5%   { stroke-dashoffset: END_VALUE;    transform: rotate(270deg); }
    37.5001%  { stroke-dashoffset: END_VALUE;    transform: rotateX(180deg) rotate(161.5deg); }
    50%     { stroke-dashoffset: START_VALUE;  transform: rotateX(180deg) rotate(161.5deg); }
    50.0001%  { stroke-dashoffset: START_VALUE;  transform: rotate(180deg); }
    62.5%   { stroke-dashoffset: END_VALUE;    transform: rotate(180deg); }
    62.5001%  { stroke-dashoffset: END_VALUE;    transform: rotateX(180deg) rotate(251.5deg); }
    75%     { stroke-dashoffset: START_VALUE;  transform: rotateX(180deg) rotate(251.5deg); }
    75.0001%  { stroke-dashoffset: START_VALUE;  transform: rotate(90deg); }
    87.5%   { stroke-dashoffset: END_VALUE;    transform: rotate(90deg); }
    87.5001%  { stroke-dashoffset: END_VALUE;    transform: rotateX(180deg) rotate(341.5deg); }
    100%    { stroke-dashoffset: START_VALUE;  transform: rotateX(180deg) rotate(341.5deg); }
  }
`;

@Component({
  selector: 'ngrx-spinner',
  host: {
    'role': 'progressbar',
    'class': 'ngrx-progress-spinner',
    '[style.width.px]': 'diameter',
    '[style.height.px]': 'diameter'
  },
  templateUrl: 'spinner.html',
  styleUrls: ['spinner.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NgrxSpinner implements OnInit, OnDestroy {
  /**
   * Tracks diameters of existing instances to de-dupe generated styles (default d = 100).
   * We need to keep track of which elements the diameters were attached to, because for
   * elements in the Shadow DOM the style tags are attached to the shadow root, rather
   * than the document head.
   */

  private static diameters = new WeakMap<Node, Set<number>>();
  private readonly unsubscribe$ = new Subject();
  private readonly fallbackAnimation: boolean = false;

  // tslint:disable-next-line:variable-name
  private _diameter = BASE_SIZE;

  /**
   * Element to which we should add the generated style tags for the indeterminate animation.
   * For most elements this is the document, but for the ones in the Shadow DOM we need to
   * use the shadow root.
   */
  private styleRoot: Node;

  /** The diameter of the progress spinner (will set width and height of svg). */
  get diameter(): number { return this._diameter; }
  set diameter(size: number) {
    this._diameter = size;

    // If this is set before `ngOnInit`, the style root may not have been resolved yet.
    if (!this.fallbackAnimation && this.styleRoot) {
      this.attachStyleNode();
    }
    this.cdr.markForCheck();
  }

  constructor(public elementRef: ElementRef<HTMLElement>,
              private readonly cdr: ChangeDetectorRef,
              @Optional() @Inject(DOCUMENT) private document: any,
              @Optional() @Inject(PLATFORM_ID) platformId?: object) {

    interval(50).pipe(
      startWith(0),
      filter(() => !!this.elementRef && !!this.elementRef.nativeElement && !!this.elementRef.nativeElement.parentElement),
      map(() => {
        const {width, height} = getComputedStyle(this.elementRef.nativeElement.parentElement);
        return {width, height};
      }),
      distinctUntilChanged((prev, cur) => prev.height === cur.height && prev.width === cur.width),
      map(style => Math.min(100, style.height ? parseInt(style.height, 10) : 0, style.width ? parseInt(style.width, 10) : 0)),
      filter(diameter => diameter > 0),
      takeUntil(this.unsubscribe$)
    ).subscribe(diameter => this.diameter = diameter);

    const trackedDiameters = NgrxSpinner.diameters;

    // The base size is already inserted via the component's structural styles. We still
    // need to track it so we don't end up adding the same styles again.
    if (!trackedDiameters.has(document.head)) {
      trackedDiameters.set(document.head, new Set<number>([BASE_SIZE]));
    }

    const isBrowser: boolean = platformId ? isPlatformBrowser(platformId) : typeof document === 'object' && !!document;
    const edge: boolean = isBrowser && /(edge)/i.test(navigator.userAgent);
    const trident: boolean = isBrowser && /(msie|trident)/i.test(navigator.userAgent);
    this.fallbackAnimation = edge || trident;
  }

  ngOnInit() {
    // Note that we need to look up the root node in ngOnInit, rather than the constructor, because
    // Angular seems to create the element outside the shadow root and then moves it inside, if the
    // node is inside an `ngIf` and a ShadowDom-encapsulated component.
    this.styleRoot = _getShadowRoot(this.elementRef.nativeElement) || this.document.head;
    this.attachStyleNode();

    // On IE and Edge, we can't animate the `stroke-dashoffset`
    // reliably so we fall back to a non-spec animation.
    const animationClass = `ngrx-progress-spinner-indeterminate${this.fallbackAnimation ? '-fallback' : ''}-animation`;

    this.elementRef.nativeElement.classList.add(animationClass);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** The radius of the spinner, adjusted for stroke width. */
  get circleRadius() {
    return (this.diameter - BASE_STROKE_WIDTH) / 2;
  }

  /** The view box of the spinner's svg element. */
  get viewBox() {
    const viewBox = this.circleRadius * 2 + this.strokeWidth;
    return `0 0 ${viewBox} ${viewBox}`;
  }

  /** The stroke circumference of the svg circle. */
  get strokeCircumference(): number {
    return 2 * Math.PI * this.circleRadius;
  }

  /** The dash offset of the svg circle. */
  get strokeDashOffset() {
    return this.strokeCircumference * 0.2;
  }

  /** Stroke width of the circle in percent. */
  get circleStrokeWidth() {
    return this.strokeWidth / this.diameter * 100;
  }

  /** Stroke width of the progress spinner. */
  private get strokeWidth(): number {
    return this.diameter / 10;
  }

  /** Dynamically generates a style tag containing the correct animation for this diameter. */
  private attachStyleNode(): void {
    const styleRoot = this.styleRoot;
    const currentDiameter = this._diameter;
    const diameters = NgrxSpinner.diameters;
    let diametersForElement = diameters.get(styleRoot);

    if (!diametersForElement || !diametersForElement.has(currentDiameter)) {
      const styleTag: HTMLStyleElement = this.document.createElement('style');
      styleTag.setAttribute('ngrx-spinner-animation', currentDiameter + '');
      styleTag.textContent = this.getAnimationText();
      styleRoot.appendChild(styleTag);

      if (!diametersForElement) {
        diametersForElement = new Set<number>();
        diameters.set(styleRoot, diametersForElement);
      }

      diametersForElement.add(currentDiameter);
    }
  }

  /** Generates animation styles adjusted for the spinner's diameter. */
  private getAnimationText(): string {
    return INDETERMINATE_ANIMATION_TEMPLATE
      // Animation should begin at 5% and end at 80%
      .replace(/START_VALUE/g, `${0.95 * this.strokeCircumference}`)
      .replace(/END_VALUE/g, `${0.2 * this.strokeCircumference}`)
      .replace(/DIAMETER/g, `${this.diameter}`);
  }
}
