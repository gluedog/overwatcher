import { MatDialog } from '@angular/material/dialog';
import { pairwise, filter, takeUntil, withLatestFrom, debounce, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import {
  AfterViewInit,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  delay,
  of,
  tap,
  map,
  repeat,
  Subject,
  Subscription,
} from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ChainState } from '@store/chain/chain.reducer';
import { chainActions } from '@store/chain/chain.actions';
import * as chainSelectors from '@store/chain/chain.selectors';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { RulesModalComponent } from '@components/rules-modal/rules-modal.component';

@Component({
  selector: 'ovw-tx-table',
  templateUrl: './tx-table.component.html',
  styleUrls: ['./tx-table.component.scss'],
})
export class TxTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('container') virtualScrollViewport!: CdkVirtualScrollViewport;

  public availableTokens = [
    {
      name: 'BOX',
      contract: 'token.defi',
      limits: {
        upper: 1000,
        lower: 1,
      },
      defaultActionLength: 15000,
    },
    {
      name: 'DMD',
      contract: 'dmd.efi',
      limits: {
        upper: 100,
        lower: 0.1,
      },
      defaultActionLength: 500,
    },
    {
      name: 'DEX',
      contract: 'token.newdex',
      limits: {
        upper: 100000,
        lower: 100,
      },
      defaultActionLength: 500,
    },
    {
      name: 'PIZZA',
      contract: 'pizzatotoken',
      limits: {
        upper: 100000,
        lower: 100,
      },
      defaultActionLength: 500,
    },
    {
      name: 'CHEX',
      contract: 'chexchexchex',
      limits: {
        upper: 50000,
        lower: 50,
      },
      defaultActionLength: 500,
    },
    {
      name: 'PWOMBAT',
      contract: 'wmbt.ptokens',
      limits: {
        upper: 250000,
        lower: 250,
      },
      defaultActionLength: 500,
    },
    {
      name: 'BOID',
      contract: 'boidcomtoken',
      limits: {
        upper: 10000000,
        lower: 10000,
      },
      defaultActionLength: 500,
    },
    {
      name: 'ZEOS',
      contract: 'thezeostoken',
      limits: {
        upper: 100000,
        lower: 100,
      },
      defaultActionLength: 500,
    },
    {
      name: 'OGX',
      contract: 'core.ogx',
      limits: {
        upper: 100000,
        lower: 100,
      },
      defaultActionLength: 500,
    },
    {
      name: 'DAPP',
      contract: 'dappservices',
      limits: {
        upper: 1000000,
        lower: 1000,
      },
      defaultActionLength: 500,
    },
    {
      name: 'IQ',
      contract: 'everipediaiq',
      limits: {
        upper: 100000,
        lower: 100,
      },
      defaultActionLength: 500,
    },
    {
      name: 'XSOV',
      contract: 'xsovxsovxsov',
      limits: {
        upper: 100000,
        lower: 100,
      },
      defaultActionLength: 500,
    },
    {
      name: 'EMT',
      contract: 'emanateoneos',
      limits: {
        upper: 100000,
        lower: 100,
      },
      defaultActionLength: 500,
    },
    {
      name: 'HUB',
      contract: 'hub.efi',
      limits: {
        upper: 100000,
        lower: 100,
      },
      defaultActionLength: 500,
    },
    {
      name: 'DOP',
      contract: 'dop.efi',
      limits: {
        upper: 100000,
        lower: 100,
      },
      defaultActionLength: 500,
    },
    {
      name: 'DFS',
      contract: 'minedfstoken',
      limits: {
        upper: 1000,
        lower: 1,
      },
      defaultActionLength: 500,
    },
    {
      name: 'PINK',
      contract: 'pink.bank',
      limits: {
        upper: 100000,
        lower: 1000,
      },
      defaultActionLength: 500,
    },
  ];

  // DMD,DOP,HUB,BOX,PIZZA,CHEX,PWOMBAT,ZEOS,TPT,DFS,BOID,OGX,DAPP,XSOV,VIG,PINK

  public accountNameControl = new FormControl(this.availableTokens[0], [Validators.required]);
  public defaultLengthControl = new FormControl(
    this.availableTokens[0]?.defaultActionLength,
    [Validators.required, Validators.min(100)]
  );
  public minQtyControl = new FormControl(
    this.availableTokens[0].limits.lower,
    [Validators.required]
  );
  public formGroup = new FormGroup({
    accountName: this.accountNameControl,
  });
  public oldListLength = 0;
  public newListLength = 0;
  public currentLength = 0;
  public getActionList$ = this.chainStore
    .select(chainSelectors.getActions)
    .pipe(
      tap((list) => {
        this.oldListLength = this.newListLength;
        this.newListLength = list.length;
        if (this.isInitialLoadingCompleted) {
          if (this.isLiveMode) {
            if (this.oldListLength !== this.newListLength) {
              this.scrollToBottom();
            }
          } else {
            this.scrollToBottomAfterLoadMore();
          }
        }
      })
    );

  public getLoading$ = this.chainStore.select(chainSelectors.isLoading);
  private currentPage: number = 0;
  public loadMoreActionsPage = false;
  private loadedPages = 0;
  public getMetadata$ = this.chainStore.select(chainSelectors.loadingData).pipe(
    filter((data) => data.page !== this.currentPage),
    tap((data) => {
      this.currentPage = data.page;
      if (this.currentPage <= this.selectedActions / 100) {
        this.scrollToBottom();
        this.chainStore.dispatch(
          chainActions.loadInitialActions({
            payload: {
              accountName: this.accountName,
              lowerLimit: this.selectedMinQty,
              actionLength: this.selectedActions,
              displayBots: this.isDisplayBots
            },
          })
        );
      }
      // else if (this.loadMoreActionsPage <= this.defaultLengthControl.value! / 100) {
      //   this.chainStore.dispatch(
      //     chainActions.loadMoreActions({
      //       payload: {
      //         accountName: this.accountName,
      //         lowerLimit: +this.minQtyControl.value!,
      //         isInfiniteScroll: true,
      //         displayBots: this.isDisplayBots
      //       },
      //     })
      //   );
      // }
      else {
        this.scrollToBottom();
        this.isInitialLoadingCompleted = true;
        this.accountNameControl.enable();
        this.defaultLengthControl.enable();
        this.minQtyControl.enable();
        if (!this.loadMoreActionsPage) {
          this.isLiveMode = true;
          this.startPolling();
        }
        // this.startPolling();
      }

      if (this.loadMoreActionsPage) {
        this.loadedPages++;
        // this.scrollToBottom();
        if (this.loadedPages < this.selectedActions / 100) {
          this.chainStore.dispatch(
            chainActions.loadMoreActions({
              payload: {
                accountName: this.accountName,
                lowerLimit: +this.selectedMinQty,
                isInfiniteScroll: false,
                displayBots: this.isDisplayBots
              },
            })
          );
        } else {
          // this.scrollToBottom();
          this.loadMoreActionsPage = false;
          this.accountNameControl.enable();
          this.defaultLengthControl.enable();
          this.minQtyControl.enable();
          this.loadedPages = 0;
          this.isLiveMode = true;
          this.startPolling();
        }
      }
    })
  );

  currentData: any = [];

  public accountName: string = '';
  public isLiveMode: boolean = false;
  public isDisplayBots: boolean = true;
  public displayBots: boolean = true;
  private poll$: Subscription | null = null;
  public isDarkTheme = true;
  public isScrolledBottom = false;

  private destroyed$ = new Subject<void>();
  public bottomPosition = 0;
  public topPosition = 0;
  public isInitialLoadingCompleted: boolean = false;
  public isInitialData = true;

  private selectedMinQty = 0;
  private selectedActions = 0;
  private liveModeDestroy$ = new Subject();

  private destroy$ = new Subject();

  public selectedToken: any;
  constructor(
    private chainStore: Store<ChainState>,
    private zone: NgZone,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.accountName = this.accountNameControl.value?.contract || '';
    this.selectedToken = this.accountNameControl.value;
    this.selectedMinQty = this.minQtyControl.value!;
    this.selectedActions = this.defaultLengthControl.value!;
    this.getMetadata$.subscribe();
    // this.startPolling();
    // this.chainStore.dispatch(
    //   chainActions.loadActions({
    //     payload: {
    //       accountName:this.accountName,
    //       isPooling: true,
    //       lowerLimit: +this.minQtyControl.value!,
    //       displayBots: this.isDisplayBots
    //     },
    //   })
    // )

    this.accountNameControl.valueChanges
      .pipe(
        takeUntil(this.destroyed$),
        distinctUntilChanged(),
        tap((value) => {
          if (!this.accountNameControl.disabled && !this.loadMoreActionsPage) {
            this.minQtyControl.patchValue(value!.limits.lower);
            this.defaultLengthControl.patchValue(value!.defaultActionLength);
          }
        })
      )
      .subscribe();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();

    this.virtualScrollViewport
      .elementScrolled()
      .pipe(
        // debounceTime(10),
        map(() => this.virtualScrollViewport.measureScrollOffset('bottom')))
      .subscribe((res) => {
        this.bottomPosition = res;
      });

    this.virtualScrollViewport
      .elementScrolled()
      .pipe(
        // debounceTime(400),
        map(() => this.virtualScrollViewport.measureScrollOffset('top')),
        tap(res => {
          this.topPosition = res;
        }),
        // pairwise(),
        // withLatestFrom(this.getLoading$),
        // filter(
        //   ([[y1, y2], loadingState]) =>
        //     y1 > y2 && y1 < 100 && !loadingState && !this.isLiveMode && this.isInitialLoadingCompleted && !this.loadMoreActionsPage
        // ),
        takeUntil(this.destroyed$)
      )
      .subscribe(() => {
        // this.zone.run(() => {
        //   this.chainStore.dispatch(
        //     chainActions.loadMoreActions({
        //       payload: {
        //         accountName: this.accountName,
        //         lowerLimit: +this.minQtyControl.value!,
        //         isInfiniteScroll: true,
        //         displayBots: this.isDisplayBots
        //       },
        //     })
        //   );
        // });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  public openHelpModal(): void {
    // const newSeasonConfirmationDate: string | null = localStorage.getItem('rules-modal');
    // const currentDate = +new Date();

    // if (currentDate > +newSeasonConfirmationDate!) {
      this.dialog.open(RulesModalComponent, {
        width: '500px',
        hasBackdrop: true,
        disableClose: false,
        autoFocus: false
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
    // }
  }

  public scrollToBottom(): void {
    if (this.loadMoreActionsPage) {
      return
    }
    setTimeout(() => {
      this.virtualScrollViewport.scrollTo({
        bottom: 0,
        behavior: 'auto',
      });
    }, 0);
    // TODO: additional scroll for padding
    setTimeout(() => {
      this.virtualScrollViewport.scrollTo({
        bottom: 0,
        behavior: 'auto',
      });
    }, 100);
  }

  public scrollBottomSmooth(): void {
    this.virtualScrollViewport.scrollTo({
      bottom: 0,
      behavior: 'smooth',
    });
    // TODO: additional scroll for padding
    setTimeout(() => {
      this.virtualScrollViewport.scrollTo({
        bottom: 0,
        behavior: 'auto',
      });
    }, 1000)
  }

  private scrollToBottomAfterLoadMore(): void {
    // console.log('scrollToBottomAfterLoadMore')
    // console.log('this.topPosition', this.topPosition);
    // this.virtualScrollViewport.scrollToIndex(
    //   this.newListLength - this.oldListLength
    // );
    // console.log('this.newListLength - this.currentLength', this.newListLength - this.currentLength);

    // this.virtualScrollViewport.scrollTo({
    //   top: this.topPosition + ((this.newListLength - this.currentLength + 9) * 20),
    //   behavior: 'auto'
    // });

    this.virtualScrollViewport.scrollTo({
      bottom: this.bottomPosition,
      behavior: 'auto'
    });

    setTimeout(() => {
      this.virtualScrollViewport.scrollTo({
        bottom: this.bottomPosition,
        behavior: 'auto'
      });
    }, 0)

    this.currentLength = this.newListLength;
    // this.virtualScrollViewport.scrollTo({
    //   top: 0,
    //   behavior: 'auto',
    // });
    // setTimeout(() => {
    //   this.virtualScrollViewport.scrollTo({
    //     top: this.topPosition,
    //     behavior: 'auto',
    //   });
    //   this.topPosition = this.virtualScrollViewport.measureScrollOffset('top');
    // }, 1000)
    // const test = this.virtualScrollViewport.measureScrollOffset('top');
    // console.log('test', test);
  }

  public applyFilter() {
    this.accountName = this.accountNameControl.value?.contract!;
    this.selectedToken = this.accountNameControl.value;
    this.bottomPosition = 0;
    this.oldListLength = 0;
    this.newListLength = 0;
    this.currentPage = 0;
    this.isLiveMode = false;
    this.isInitialData = false;
    if (this.poll$) {
      this.poll$.unsubscribe();
    }
    this.isDisplayBots = this.displayBots;
    this.isInitialLoadingCompleted = false;
    this.selectedMinQty = this.minQtyControl.value!;
    this.selectedActions = this.defaultLengthControl.value!;
    this.accountNameControl.disable();
    this.defaultLengthControl.disable();
    this.minQtyControl.disable();
    this.chainStore.dispatch(chainActions.clearActions());
    this.chainStore.dispatch(
      chainActions.loadActions({
        payload: {
          accountName: this.accountName,
          isPooling: true,
          lowerLimit: this.selectedMinQty,
          displayBots: this.isDisplayBots
        },
      })
    );
  }

  public scrollMoreActions(): void {
    // this.isInitialLoadingCompleted = false;
    this.isLiveMode = false;
    if (this.poll$) {
      this.poll$.unsubscribe();
    };
    this.loadMoreActionsPage = true;
    this.accountNameControl.disable();
    this.defaultLengthControl.disable();
    this.minQtyControl.disable();
    this.currentLength = this.newListLength;
    this.chainStore.dispatch(
      chainActions.loadMoreActions({
        payload: {
          accountName: this.accountName,
          lowerLimit: this.selectedMinQty,
          isInfiniteScroll: false,
          displayBots: this.isDisplayBots
        },
      })
    );
  }

  private startPolling() {
    if (this.poll$) {
      this.poll$.unsubscribe();
    }

    this.poll$ = of({})
      .pipe(
        tap((_) =>
          this.chainStore.dispatch(
            chainActions.loadActions({
              payload: {
                accountName:this.accountName,
                isPooling: true,
                lowerLimit: this.selectedMinQty,
                displayBots: this.isDisplayBots
              },
            })
          )
        ),
        delay(5000),
        repeat(),
        // takeUntil(this.liveModeDestroy$) // TODO: not working
      )
      .subscribe();
  }

  public onLiveModeChange(): void {
    if (this.isLiveMode) {
      this.startPolling();
    } else {
      if (this.poll$) {
        this.liveModeDestroy$.next(true);
        this.liveModeDestroy$.next(false);
        this.poll$.unsubscribe();
      }
    }
  }

  public onDisplayBotsChange(): void {
  }

  public switchTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
  }

  public displayTx(data: any): string {
    const newdexAccounts = ['agg.newdex', 'newdexpublic'];
    const isNewdex = (newdexAccounts.includes(data?.from) || newdexAccounts.includes(data?.to)) && data.memo.includes('"type":');
    const parsedMemo = isNewdex ? JSON.parse(data?.memo || {}) : data?.memo;
    let type = '';
    if (isNewdex) {
      type = parsedMemo?.type.split('-').map((el: string) => el[0].toUpperCase() + el.slice(1)).join(' ');
    }
    return isNewdex ? '[Newdex] ' + type + ' | Price: ' + parsedMemo.price : parsedMemo === 'Defibox: swap token' ? '*' : parsedMemo


  }
}
