import { Action } from '@models/actions.interface';
import { createReducer, on } from '@ngrx/store';
import { chainActions } from '@store/chain/chain.actions';

export interface ChainState {

  loading: boolean;
  initialPosition: number;
  currentPosition: number;
  infiniteScrollPosition: number;
  offset: number;
  page: number;
  bots: string[];
  actions: Action[];

}

export const initialState: ChainState = {

  loading: false,
  initialPosition: -1,
  currentPosition: -1,
  infiniteScrollPosition: 0,
  offset: -100,
  page: 0,
  bots: [
    'jamestaggart',
    'mgmgmgeoseos',
    'gravytrader1',
    'gravytrader2',
    'trader.sx',
    'scientistalb',
    'eosisgreat11',
    'traderjoejoe',
    'pascaleosage',
    'godlikehonor',
    'independence',
    'gm33jzwszhbd',
    't1kng3o2nsds',
    'hxldj5521hxl',
    'gi2tenbwgene',
    'contractwork',
    'lijinlin1555',
    'ge3geivs1mgs',
    'taggartdagny',
    't3kslv2ndkvi',
    'ghui3ysakpvu',
    'trivialarber',
    'lijinlinants',
    'kekemekeke',
    'elcotraz.ftw',
    'northernbank',
    'cosmosworlds',
    'tradefast111',
    'ijinian21312'
  ],
  actions: []

};

export const chainReducer = createReducer(

  initialState,

  on(chainActions.clearActions, (state) => ({
    ...initialState,
  })),

  on(chainActions.loadActions, (state) => ({
    ...state,
    loading: true,
  })),

  on(chainActions.loadActionsSuccess, (state, action) => ({
    ...state,
    loading: false,
    actions: state?.actions?.length ? [...state.actions, ...action.payload.filter((action: Action) => {
      return !state.actions.find(
        (ac: Action) =>
          ac.account_action_seq === action.account_action_seq
      )
    })] : action.payload
  })),

  on(chainActions.loadActionsFailed, (state) => ({
    ...state,
    loading: false,
  })),

  on(chainActions.loadMoreActions, (state) => ({
    ...state,
    loading: true,
  })),

  on(chainActions.loadMoreActionsSuccess, (state, action) => ({
    ...state,
    loading: false,
    actions: state?.actions?.length ? [...action.payload.filter((action: Action) => {
      return !state.actions.find(
        (ac: Action) =>
          ac.account_action_seq === action.account_action_seq
      )
    }), ...state.actions] : action.payload
  })),

  on(chainActions.loadMoreActionsFailed, (state) => ({
    ...state,
    loading: false,
  })),

  on(chainActions.loadInitialActions, (state) => ({
    ...state,
    loading: true,
  })),

  on(chainActions.loadInitialActionsSuccess, (state, action) => ({
    ...state,
    loading: false,
    actions: state?.actions?.length ? [...state.actions, ...action.payload.filter((action: Action) => {
      return !state.actions.find(
        (ac: Action) =>
          ac.account_action_seq === action.account_action_seq
      )
    })] : action.payload
  })),

  on(chainActions.loadInitialActionsFailed, (state) => ({
    ...state,
    loading: false,
  })),

  on(chainActions.updateMetaData, (state, action) => ({
    ...state,
    initialPosition: action.payload.initialPosition || state.initialPosition,
    currentPosition: action.payload.currentPosition || state.currentPosition,
    infiniteScrollPosition: action.payload.infiniteScrollPosition || state.infiniteScrollPosition,
    offset: action.payload.offset || state.offset,
    page: action.payload.page || state.page
  })),

);
