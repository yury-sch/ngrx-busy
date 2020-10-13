import {AfterViewInit, Component, OnDestroy, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {merge, Observable, Subject} from 'rxjs';
import {map, publishReplay, refCount, startWith, switchMap, takeUntil} from 'rxjs/operators';
import {GithubIssue, GithubService} from './github.service';
import {NgrxBusy} from '../../../ngrx-busy/src/lib/busy';
import {withBusy} from '../../../ngrx-busy/src/lib/rx-busy';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {

  private readonly unsubscribe$ = new Subject();

  data: Observable<GithubIssue[]>;
  total: Observable<number>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(NgrxBusy) busy: NgrxBusy;

  constructor(private github: GithubService) {
  }

  ngAfterViewInit() {
    this.sort.sortChange
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => this.paginator.pageIndex = 0);

    const issues$ = merge(this.sort.sortChange, this.paginator.page).pipe(
      startWith({}),
      switchMap(() => this.github.getRepoIssues(this.sort.active, this.sort.direction, this.paginator.pageIndex)),
      withBusy(() => this.busy),
      publishReplay(1), refCount()
    );

    this.data = issues$.pipe(map(data => data.items));
    this.total = issues$.pipe(map(data => data.total_count));
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}


