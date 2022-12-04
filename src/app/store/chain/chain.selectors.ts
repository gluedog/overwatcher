import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ChainState } from '@store/chain/chain.reducer';

export const getAuthStore = createFeatureSelector<ChainState>('chain');

export const isLoading = createSelector(
  getAuthStore,
  (chainStore: ChainState) => chainStore?.loading
);

export const loadingData = createSelector(
  getAuthStore,
  (chainStore: ChainState) => ({
    initialPosition: chainStore.initialPosition,
    currentPosition: chainStore.currentPosition,
    infiniteScrollPosition: chainStore.infiniteScrollPosition,
    offset: chainStore.offset,
    bots: chainStore.bots,
    page: chainStore.page
  })
);

export const getActions = createSelector(
  getAuthStore,
  (chainStore: ChainState) => chainStore?.actions
);
