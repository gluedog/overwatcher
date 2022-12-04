import { Injectable } from '@angular/core';
import { switchMap, tap, catchError, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { chainActions } from '@store/chain/chain.actions';
import { ChainState } from '@store/chain/chain.reducer';
import { of } from 'rxjs';
import { ChainService } from '@services/chain.service';
import { ActionList, Action } from '@models/actions.interface';
import * as chainSelectors from '@store/chain/chain.selectors';

@Injectable()
export class ChainEffects {
  constructor(
    private actions$: Actions,
    private chainStore: Store<ChainState>,
    private chainService: ChainService
  ) {}

  public getActions$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(chainActions.loadActions),
        withLatestFrom(this.chainStore.select(chainSelectors.loadingData)),
        switchMap(
          ([action, loadingData]: [
            {
              payload: {
                accountName: string;
                isPooling: boolean;
                lowerLimit: number;
                displayBots: boolean;
              };
            },
            {
              initialPosition: number;
              currentPosition: number;
              infiniteScrollPosition: number;
              offset: number;
              bots: string[];
              page: number;
            }
          ]) => {
            return this.chainService
              .getHistory(
                action.payload.accountName,
                loadingData.currentPosition,
                loadingData.offset
              )
              .pipe(
                tap((data: ActionList) => {
                  let newLoadingData: any = {};

                  if (loadingData.currentPosition === -1) {
                    newLoadingData.page = loadingData.page + 1;
                  }

                  if (data?.actions?.length) {
                    newLoadingData.currentPosition =
                      data.actions[
                        data.actions.length - 1
                      ]!.account_action_seq!;
                    newLoadingData.infiniteScrollPosition =
                      !loadingData?.infiniteScrollPosition &&
                      loadingData?.infiniteScrollPosition <
                        data.actions[0].account_action_seq
                        ? data.actions[0].account_action_seq
                        : loadingData?.infiniteScrollPosition;
                    newLoadingData.offset = 100;
                  }

                  if (data?.actions?.length) {
                    if (!loadingData?.initialPosition) {
                      newLoadingData.initialPosition =
                        data.actions[0].account_action_seq + 100;
                    } else {
                      newLoadingData.initialPosition =
                        data.actions[0].account_action_seq + 100 >
                        loadingData?.infiniteScrollPosition
                          ? data.actions[0].account_action_seq + 100
                          : loadingData?.infiniteScrollPosition;
                    }

                    if (!loadingData?.infiniteScrollPosition) {
                      newLoadingData.infiniteScrollPosition =
                        data.actions[0].account_action_seq;
                    } else {
                      newLoadingData.infiniteScrollPosition =
                        data.actions[0].account_action_seq <
                        loadingData?.infiniteScrollPosition
                          ? data.actions[0].account_action_seq
                          : loadingData?.infiniteScrollPosition;
                    }
                  }

                  // 1. from == "token.defi" and (memo == "Issue for*" or memo == "Issue to*)
                  // 2. from == lptoken.defi && to == lend.defi
                  // 3. from == "lend.defi" && to == "lpr.defi"

                  const filteredActions: Action[] = data?.actions
                  ?.filter((a) => {
                    const isBot =
                      loadingData.bots.includes(
                        a.action_trace.act.data?.from
                      ) ||
                      loadingData.bots.includes(a.action_trace.act.data?.to);

                    return (
                      a?.action_trace?.act.data?.from &&
                      a?.action_trace?.act?.data?.to &&
                      +a?.action_trace?.act?.data?.quantity?.split(' ')[0] >=
                        +action.payload.lowerLimit &&
                      !(
                        a?.action_trace?.act?.data?.from === 'lptoken.defi' &&
                        (a?.action_trace?.act?.data?.memo.includes('Issue for mine'))
                      ) &&
                      !(
                        a?.action_trace?.act?.data?.from === 'saving.defi' &&
                        (a?.action_trace?.act?.data?.memo.includes('BSS Reward'))
                      ) &&
                      !(
                        a?.action_trace?.act?.data?.from === 'token.defi' &&
                        (a?.action_trace?.act?.data?.memo.includes(
                          'Issue for'
                        ) ||
                          a?.action_trace?.act?.data?.memo.includes(
                            'Issue to'
                          ))
                      ) &&
                      !(
                        a?.action_trace?.act?.data?.from === 'lptoken.defi' &&
                        a?.action_trace?.act?.data?.to === 'lend.defi'
                      ) &&
                      !(
                        a?.action_trace?.act?.data?.from === 'lend.defi' &&
                        a?.action_trace?.act?.data?.to === 'lpr.defi'
                      ) &&
                      (action.payload.displayBots ? true : !isBot)
                      && (a.action_trace.act.data.quantity?.split(' ')[1] !== 'TIIP')
                    );
                  })
                    .map((action) => {
                      const isBot =
                        loadingData.bots.includes(
                          action.action_trace.act.data?.from
                        ) ||
                        loadingData.bots.includes(
                          action.action_trace.act.data?.to
                        );

                      const isNewdex =
                        (action.action_trace.act.data?.from ===
                          'newdexpublic' &&
                          action.action_trace.act.data?.memo.includes(
                            '"type":"cancel-order"'
                          )) ||
                        (action.action_trace.act.data?.to === 'newdexpublic' &&
                          action.action_trace.act.data?.memo.includes(
                            '"type":"sell-limit"'
                          )) ||
                        (action.action_trace.act.data.from === 'agg.newdex' || action.action_trace.act.data.to === 'agg.newdex');

                      const isBuyOrder =
                        (action.action_trace.act.data?.from ===
                          'dolphinsswap' &&
                          action.action_trace.act.data?.memo.includes(
                            'DolphinSwap: swap token'
                          )) ||
                        (action.action_trace.act.data?.from ===
                          'defisswapcnt' &&
                          action.action_trace.act.data?.memo.includes(
                            'swap success'
                          )) ||
                        (action.action_trace.act.data?.from ===
                          'newdexpublic' &&
                          action.action_trace.act.data?.memo.includes(
                            'order-filled'
                          )) ||
                        (action.action_trace.act.data?.from === 'swap.defi' &&
                          action.action_trace.act.data?.memo.includes(
                            'Defibox: swap token'
                          ));

                      const isLendingOrder =
                        (action.action_trace.act.data?.from === 'lend.defi'
                        || action.action_trace.act.data?.to === 'lend.defi')
                        ||
                        (action.action_trace.act.data?.from === 'pzalendsaved'
                        && action.action_trace.act.data?.memo.includes('bank borrow'))
                        ||
                        (action.action_trace.act.data?.from === 'pzalendsaved'
                        || action.action_trace.act.data?.from === 'pzalendcntct')
                        ||
                        (action.action_trace.act.data?.to === 'pzalendsaved'
                        || action.action_trace.act.data?.to === 'pzalendcntct')


                      // if ("to" is "dolphinsswap" or "defisswapcnt" or "swap.defi") and ("memo" contains "swap:" or "swap,")
                      const isSellOrder =
                        ['dolphinsswap', 'defisswapcnt', 'swap.defi'].includes(
                          action.action_trace.act.data?.to
                        ) &&
                        (action.action_trace.act.data?.memo.includes('swap:') ||
                          action.action_trace.act.data?.memo.includes('swap,'));

                      const isWithdraw =
                        action.action_trace.act.data?.from === 'swap.defi' &&
                        action.action_trace.act.data?.memo.includes('Defibox: withdraw');

                      return {
                        ...action,
                        type: isBot 
                          ? 'bot'
                          : isBuyOrder 
                          ? 'buy'
                          : isSellOrder
                          ? 'sell'
                          : isLendingOrder
                          ? 'lending'
                          : isWithdraw 
                          ? 'withdraw'
                          : isNewdex
                          ? 'newdex'
                          : '',
                        isBot,
                        isNewdex,
                        isSell: isSellOrder,
                        isBuy: isBuyOrder,
                        isLendingOrder: isLendingOrder
                      };
                    });
                  this.chainStore.dispatch(
                    chainActions.loadActionsSuccess({
                      payload:
                        loadingData.currentPosition === -1
                          ? []
                          : filteredActions,
                    })
                  );
                  this.chainStore.dispatch(
                    chainActions.updateMetaData({
                      payload: {
                        ...newLoadingData,
                      },
                    })
                  );
                }),
                catchError((err) => {
                  this.chainStore.dispatch(chainActions.loadActionsFailed());
                  return of(null);
                })
              );
          }
        ),
      );
    },
    { dispatch: false }
  );

  public getMoreActions$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(chainActions.loadMoreActions),
        withLatestFrom(this.chainStore.select(chainSelectors.loadingData)),
        switchMap(
          ([action, loadingData]: [
            {
              payload: {
                accountName: string;
                lowerLimit: number;
                isInfiniteScroll: boolean;
                displayBots: boolean;
              };
            },
            {
              initialPosition: number;
              currentPosition: number;
              infiniteScrollPosition: number;
              offset: number;
              bots: string[];
              page: number;
            }
          ]) => {
            return this.chainService
              .getHistory(
                action.payload.accountName,
                loadingData.infiniteScrollPosition,
                -loadingData.offset
              )
              .pipe(
                tap((data: ActionList) => {
                  let newLoadingData: any = {};

                  newLoadingData.page = loadingData.page + 1;

                  if (data?.actions?.length) {
                    if (!loadingData?.infiniteScrollPosition) {
                      newLoadingData.infiniteScrollPosition =
                        data.actions[0].account_action_seq;
                    } else {
                      newLoadingData.infiniteScrollPosition =
                        data.actions[0].account_action_seq <
                        loadingData?.infiniteScrollPosition
                          ? data.actions[0].account_action_seq
                          : loadingData?.infiniteScrollPosition;
                    }
                  }

                  const filteredActions: Action[] = data?.actions
                  ?.filter((a) => {
                    const isBot =
                      loadingData.bots.includes(
                        a.action_trace.act.data?.from
                      ) ||
                      loadingData.bots.includes(a.action_trace.act.data?.to);

                    return (
                      a?.action_trace?.act.data?.from &&
                      a?.action_trace?.act?.data?.to &&
                      +a?.action_trace?.act?.data?.quantity?.split(' ')[0] >=
                        +action.payload.lowerLimit &&
                      !(
                        a?.action_trace?.act?.data?.from === 'lptoken.defi' &&
                        (a?.action_trace?.act?.data?.memo.includes('Issue for mine'))
                      ) &&
                      !(
                        a?.action_trace?.act?.data?.from === 'saving.defi' &&
                        (a?.action_trace?.act?.data?.memo.includes('BSS Reward'))
                      ) &&
                      !(
                        a?.action_trace?.act?.data?.from === 'token.defi' &&
                        (a?.action_trace?.act?.data?.memo.includes(
                          'Issue for'
                        ) ||
                          a?.action_trace?.act?.data?.memo.includes(
                            'Issue to'
                          ))
                      ) &&
                      !(
                        a?.action_trace?.act?.data?.from === 'lptoken.defi' &&
                        a?.action_trace?.act?.data?.to === 'lend.defi'
                      ) &&
                      !(
                        a?.action_trace?.act?.data?.from === 'lend.defi' &&
                        a?.action_trace?.act?.data?.to === 'lpr.defi'
                      ) &&
                      (action.payload.displayBots ? true : !isBot)
                      && (a.action_trace.act.data.quantity?.split(' ')[1] !== 'TIIP')
                    );
                  })
                    .map((action) => {
                      const isBot =
                        loadingData.bots.includes(
                          action.action_trace.act.data?.from
                        ) ||
                        loadingData.bots.includes(
                          action.action_trace.act.data?.to
                        );

                      const isNewdex =
                        (action.action_trace.act.data?.from ===
                          'newdexpublic' &&
                          action.action_trace.act.data?.memo.includes(
                            '"type":"cancel-order"'
                          )) ||
                        (action.action_trace.act.data?.to === 'newdexpublic' &&
                          action.action_trace.act.data?.memo.includes(
                            '"type":"sell-limit"'
                          )) ||
                        (action.action_trace.act.data.from === 'agg.newdex' || action.action_trace.act.data.to === 'agg.newdex');

                      const isBuyOrder =
                        (action.action_trace.act.data?.from ===
                          'dolphinsswap' &&
                          action.action_trace.act.data?.memo.includes(
                            'DolphinSwap: swap token'
                          )) ||
                        (action.action_trace.act.data?.from ===
                          'defisswapcnt' &&
                          action.action_trace.act.data?.memo.includes(
                            'swap success'
                          )) ||
                        (action.action_trace.act.data?.from ===
                          'newdexpublic' &&
                          action.action_trace.act.data?.memo.includes(
                            'order-filled'
                          )) ||
                        (action.action_trace.act.data?.from === 'swap.defi' &&
                          action.action_trace.act.data?.memo.includes(
                            'Defibox: swap token'
                          ));

                        const isLendingOrder =
                          (action.action_trace.act.data?.from === 'lend.defi'
                          || action.action_trace.act.data?.to === 'lend.defi')
                          ||
                          (action.action_trace.act.data?.from === 'pzalendsaved'
                          && action.action_trace.act.data?.memo.includes('bank borrow'))
                          ||
                          (action.action_trace.act.data?.from === 'pzalendsaved'
                          || action.action_trace.act.data?.from === 'pzalendcntct')
                          ||
                          (action.action_trace.act.data?.to === 'pzalendsaved'
                          || action.action_trace.act.data?.to === 'pzalendcntct')

                      // if ("to" is "dolphinsswap" or "defisswapcnt" or "swap.defi") and ("memo" contains "swap:" or "swap,")
                      const isSellOrder =
                        ['dolphinsswap', 'defisswapcnt', 'swap.defi'].includes(
                          action.action_trace.act.data?.to
                        ) &&
                        (action.action_trace.act.data?.memo.includes('swap:') ||
                          action.action_trace.act.data?.memo.includes('swap,'));

                      const isWithdraw =
                          action.action_trace.act.data?.from === 'swap.defi' &&
                          action.action_trace.act.data?.memo.includes('Defibox: withdraw');

                      return {
                        ...action,
                        type: isBot 
                          ? 'bot'
                          : isBuyOrder 
                          ? 'buy'
                          : isSellOrder
                          ? 'sell'
                          : isLendingOrder
                          ? 'lending'
                          : isWithdraw 
                          ? 'withdraw'
                          : isNewdex
                          ? 'newdex'
                          : '',
                        isBot,
                        isNewdex,
                        isSell: isSellOrder,
                        isBuy: isBuyOrder,
                        isLendingOrder: isLendingOrder
                      };
                    });
                  this.chainStore.dispatch(
                    chainActions.loadMoreActionsSuccess({
                      payload: filteredActions,
                    })
                  );
                  this.chainStore.dispatch(
                    chainActions.updateMetaData({
                      payload: {
                        ...newLoadingData,
                        needReload:
                          !filteredActions?.length &&
                          action.payload.isInfiniteScroll,
                      },
                    })
                  );

                  if (
                    !filteredActions?.length &&
                    action.payload.isInfiniteScroll
                  ) {
                    this.chainStore.dispatch(
                      chainActions.loadMoreActions({
                        payload: {
                          accountName: action.payload.accountName,
                          lowerLimit: action.payload.lowerLimit,
                          isInfiniteScroll: action.payload.isInfiniteScroll,
                          displayBots: action.payload.displayBots,
                        },
                      })
                    );
                  }
                }),
                catchError((err) => {
                  console.log('err', err);
                  this.chainStore.dispatch(chainActions.loadMoreActionsFailed());
                  return of(null);
                })
              );
          }
        ),
      );
    },
    { dispatch: false }
  );

  public getInitialActions$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(chainActions.loadInitialActions),
        withLatestFrom(this.chainStore.select(chainSelectors.loadingData)),
        switchMap(
          ([action, loadingData]: [
            {
              payload: {
                accountName: string;
                lowerLimit: number;
                actionLength: number;
                displayBots: boolean;
              };
            },
            {
              initialPosition: number;
              currentPosition: number;
              infiniteScrollPosition: number;
              offset: number;
              bots: string[];
              page: number;
            }
          ]) => {
            let position =
              loadingData.initialPosition === -1
                ? loadingData.initialPosition
                : loadingData.initialPosition -
                  action.payload.actionLength +
                  loadingData.page * 100 - 100;
            return this.chainService
              .getHistory(
                action.payload.accountName,
                position,
                loadingData.initialPosition === -1
                  ? -loadingData.offset
                  : loadingData.offset
              )
              .pipe(
                tap((data: ActionList) => {
                  let newLoadingData: any = {};

                  newLoadingData.page = loadingData.page + 1;

                  if (data?.actions?.length) {
                    if (!loadingData?.initialPosition) {
                      newLoadingData.initialPosition =
                        data.actions[0].account_action_seq + 100;
                    } else {
                      newLoadingData.initialPosition =
                        data.actions[0].account_action_seq + 100 >
                        loadingData?.initialPosition
                          ? data.actions[0].account_action_seq + 100
                          : loadingData?.initialPosition;
                    }

                    if (!loadingData?.infiniteScrollPosition) {
                      newLoadingData.infiniteScrollPosition =
                        data.actions[0].account_action_seq;
                    } else {
                      newLoadingData.infiniteScrollPosition =
                        data.actions[0].account_action_seq <
                        loadingData?.infiniteScrollPosition
                          ? data.actions[0].account_action_seq
                          : loadingData?.infiniteScrollPosition;
                    }
                  }

                  const filteredActions: Action[] = data?.actions
                    ?.filter((a) => {
                      const isBot =
                        loadingData.bots.includes(
                          a.action_trace.act.data?.from
                        ) ||
                        loadingData.bots.includes(a.action_trace.act.data?.to);

                      return (
                        a?.action_trace?.act.data?.from &&
                        a?.action_trace?.act?.data?.to &&
                        +a?.action_trace?.act?.data?.quantity?.split(' ')[0] >=
                          +action.payload.lowerLimit &&
                        !(
                          a?.action_trace?.act?.data?.from === 'lptoken.defi' &&
                          (a?.action_trace?.act?.data?.memo.includes('Issue for mine'))
                        ) &&
                        !(
                          a?.action_trace?.act?.data?.from === 'saving.defi' &&
                          (a?.action_trace?.act?.data?.memo.includes('BSS Reward'))
                        ) &&
                        !(
                          a?.action_trace?.act?.data?.from === 'token.defi' &&
                          (a?.action_trace?.act?.data?.memo.includes(
                            'Issue for'
                          ) ||
                            a?.action_trace?.act?.data?.memo.includes(
                              'Issue to'
                            ))
                        ) &&
                        !(
                          a?.action_trace?.act?.data?.from === 'lptoken.defi' &&
                          a?.action_trace?.act?.data?.to === 'lend.defi'
                        ) &&
                        !(
                          a?.action_trace?.act?.data?.from === 'lend.defi' &&
                          a?.action_trace?.act?.data?.to === 'lpr.defi'
                        ) &&
                        (action.payload.displayBots ? true : !isBot)
                        && (a.action_trace.act.data.quantity?.split(' ')[1] !== 'TIIP')
                      );
                    })
                    .map((action) => {
                      const isBot =
                        loadingData.bots.includes(
                          action.action_trace.act.data?.from
                        ) ||
                        loadingData.bots.includes(
                          action.action_trace.act.data?.to
                        );

                      const isNewdex =
                        (action.action_trace.act.data?.from ===
                          'newdexpublic' &&
                          action.action_trace.act.data?.memo.includes(
                            '"type":"cancel-order"'
                          )) ||
                        (action.action_trace.act.data?.to === 'newdexpublic' &&
                          action.action_trace.act.data?.memo.includes(
                            '"type":"sell-limit"'
                          ))
                          ||
                        (action.action_trace.act.data.from === 'agg.newdex' || action.action_trace.act.data.to === 'agg.newdex');

                      const isBuyOrder =
                        (action.action_trace.act.data?.from ===
                          'dolphinsswap' &&
                          action.action_trace.act.data?.memo.includes(
                            'DolphinSwap: swap token'
                          )) ||
                        (action.action_trace.act.data?.from ===
                          'defisswapcnt' &&
                          action.action_trace.act.data?.memo.includes(
                            'swap success'
                          )) ||
                        (action.action_trace.act.data?.from ===
                          'newdexpublic' &&
                          action.action_trace.act.data?.memo.includes(
                            'order-filled'
                          )) ||
                        (action.action_trace.act.data?.from === 'swap.defi' &&
                          action.action_trace.act.data?.memo.includes(
                            'Defibox: swap token'
                          ));

                        const isLendingOrder =
                          (action.action_trace.act.data?.from === 'lend.defi'
                          || action.action_trace.act.data?.to === 'lend.defi')
                          ||
                          (action.action_trace.act.data?.from === 'pzalendsaved'
                          && action.action_trace.act.data?.memo.includes('bank borrow'))
                          ||
                          (action.action_trace.act.data?.from === 'pzalendsaved'
                          || action.action_trace.act.data?.from === 'pzalendcntct')
                          ||
                          (action.action_trace.act.data?.to === 'pzalendsaved'
                          || action.action_trace.act.data?.to === 'pzalendcntct')

                      // if ("to" is "dolphinsswap" or "defisswapcnt" or "swap.defi") and ("memo" contains "swap:" or "swap,")
                      const isSellOrder =
                        ['dolphinsswap', 'defisswapcnt', 'swap.defi'].includes(
                          action.action_trace.act.data?.to
                        ) &&
                        (action.action_trace.act.data?.memo.includes('swap:') ||
                          action.action_trace.act.data?.memo.includes('swap,'));

                      const isWithdraw =
                        action.action_trace.act.data?.from === 'swap.defi' &&
                        action.action_trace.act.data?.memo.includes('Defibox: withdraw');
                        
                      return {
                        ...action,
                        type: isBot 
                          ? 'bot'
                          : isBuyOrder 
                          ? 'buy'
                          : isSellOrder
                          ? 'sell'
                          : isLendingOrder
                          ? 'lending'
                          : isWithdraw 
                          ? 'withdraw'
                          : isNewdex
                          ? 'newdex'
                          : '',
                        isBot,
                        isNewdex,
                        isSell: isSellOrder,
                        isBuy: isBuyOrder,
                        isLendingOrder: isLendingOrder
                      };
                    });
                  this.chainStore.dispatch(
                    chainActions.loadInitialActionsSuccess({
                      payload: filteredActions,
                    })
                  );
                  this.chainStore.dispatch(
                    chainActions.updateMetaData({
                      payload: {
                        ...newLoadingData,
                        // needReload: !filteredActions?.length && action.payload.isInfiniteScroll
                      },
                    })
                  );

                  // if (!filteredActions?.length && action.payload.isInfiniteScroll) {
                  //   this.chainStore.dispatch(chainActions.loadInitialActions({payload: {accountName: action.payload.accountName, lowerLimit: action.payload.lowerLimit, isInfiniteScroll: action.payload.isInfiniteScroll}}));
                  // }
                }),
                catchError((err) => {
                  this.chainStore.dispatch(chainActions.loadInitialActionsFailed());
                  return of(null);
                })
              );
          }
        ),
      );
    },
    { dispatch: false }
  );

  // updateMetadata$ = createEffect(
  //   () =>
  //     this.actions$.pipe(
  //       ofType(chainActions.updateMetaData),
  //       tap((action: any) => {
  //         console.log('action', action)
  //         if (action.needReload) {
  //           this.
  //         }
  //       })
  //     ),
  //   { dispatch: false }
  // );
}
