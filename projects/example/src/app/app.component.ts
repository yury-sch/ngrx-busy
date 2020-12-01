import {Component, OnDestroy, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {merge, Observable, of, Subject} from 'rxjs';
import {map, publishReplay, refCount, switchMap, tap} from 'rxjs/operators';
import {GithubIssue, GithubService} from './github.service';
import {NgrxBusy, withBusy} from 'projects/ngrx-busy/src/public-api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {

  private readonly unsubscribe$ = new Subject();

  data: Observable<GithubIssue[]>;
  total: Observable<number>;

  @ViewChild(MatPaginator, {static: true}) paginator!: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort!: MatSort;
  @ViewChild(NgrxBusy, {static: true}) busy!: NgrxBusy;

  constructor(private github: GithubService) {

    const issues$ = of({}).pipe(
      switchMap(() => merge(this.sort.sortChange.pipe(tap(() => this.paginator.pageIndex = 0)), this.paginator.page, of({}))),
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


