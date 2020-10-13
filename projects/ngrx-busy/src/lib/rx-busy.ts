import {from, MonoTypeOperatorFunction, Observable, Operator, Subscriber, Subscription, timer} from 'rxjs';
import {InnerSubscriber} from 'rxjs/internal-compatibility';
import {first, flatMap, map} from 'rxjs/operators';

import {NgrxBusy} from './busy';

declare type BusyAccessor = () => NgrxBusy | null;

export function withBusy<T>(accessor: BusyAccessor): MonoTypeOperatorFunction<T> {
  // if (!accessor) { throw Error('Busy container is not defined.'); }
  return (source: Observable<T>) => source.lift(new WithBusyOperator(accessor));
}

export function pushBusy<T>(source: Observable<T>): Observable<T> {
  return source.lift(new PushBusyOperator());
}

class WithBusyOperator<T> implements Operator<T, T> {
  constructor(private readonly accessor: BusyAccessor) {
  }

  call(subscriber: Subscriber<T>, source: any): any {
    return source.subscribe(new WithBusySubscriber(subscriber, this.accessor));
  }
}

class WithBusySubscriber<T> extends Subscriber<T> {
  constructor(destination: Subscriber<T>, readonly accessor: BusyAccessor) {
    super(destination);
  }
}

class PushBusyOperator<T> implements Operator<T, T> {

  call(subscriber: Subscriber<T>, source: any): any {
    let accessors: BusyAccessor[];
    try {
      accessors = Array.from(this.findBusy(subscriber)).map(busySubscriber => busySubscriber.accessor);
    } catch (e) {
      accessors = [];
    }
    return source.subscribe(new PushBusySubscriber(subscriber, accessors));
  }

  private* findBusy(innerSubscriber: Subscriber<T>): IterableIterator<WithBusySubscriber<T>> {
    if (innerSubscriber instanceof WithBusySubscriber) { yield innerSubscriber; }
    // @ts-ignore
    if (innerSubscriber instanceof InnerSubscriber) { yield* this.findBusy(innerSubscriber.parent); }
    // @ts-ignore
    if (innerSubscriber.destination !== undefined) { yield* this.findBusy(innerSubscriber.destination); }
  }
}

class PushBusySubscriber<T> extends Subscriber<T> {
  private readonly watcher: Subscription;

  constructor(destination: Subscriber<T>, private readonly accessors: BusyAccessor[]) {
    super(destination);

    this.watcher = from(accessors)
      .pipe(flatMap(accessor => timer(0, 50).pipe(map(_ => accessor()), first((busy): busy is NgrxBusy => !!busy))))
      .subscribe(busy => busy.show());
  }

  _error(err: any): void {
    this.hide();
    super._error(err);
  }

  _complete(): void {
    this.hide();
    super._complete();
  }

  unsubscribe(): void {
    this.hide();
    super.unsubscribe();
  }

  private hide(): void {
    this.watcher.unsubscribe();
    this.accessors
      .map(accessor => accessor())
      .filter((busy): busy is NgrxBusy => !!busy)
      .forEach(container => container.hide());
  }
}
