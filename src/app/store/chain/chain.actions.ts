import { Action } from '@models/actions.interface';
import { createAction, props } from '@ngrx/store';
const tag = '[chain]';

export const chainActions = {

  loadActions: createAction(`${tag} load actions`, props<{payload: {
    accountName: string,
    isPooling: boolean,
    lowerLimit: number,
    displayBots: boolean
  }}>()),
  loadActionsSuccess: createAction(`${tag} load actions success`, props<{payload: Action[]}>()),
  loadActionsFailed: createAction(`${tag} load actions failed`),

  loadMoreActions: createAction(`${tag} load more actions`, props<{payload: {
    accountName: string,
    lowerLimit: number,
    isInfiniteScroll: boolean,
    displayBots: boolean
  }}>()),
  loadMoreActionsSuccess: createAction(`${tag} load more actions success`, props<{payload: Action[]}>()),
  loadMoreActionsFailed: createAction(`${tag} load more actions failed`),

  loadInitialActions: createAction(`${tag} load initial actions`, props<{payload: {
    accountName: string,
    lowerLimit: number,
    actionLength: number,
    displayBots: boolean
  }}>()),
  loadInitialActionsSuccess: createAction(`${tag} load initial actions success`, props<{payload: Action[]}>()),
  loadInitialActionsFailed: createAction(`${tag} load initial actions failed`),

  updateMetaData: createAction(`${tag} update metadata actions`, props<{
    payload: {
      initialPosition: number;
      currentPosition: number;
      infiniteScrollPosition: number;
      offset: number;
      page: number;
      needReload: boolean;
    }
  }>()),
  clearActions: createAction(`${tag} clear actions`),

};
