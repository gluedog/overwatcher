import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { chainReducer } from '@store/chain/chain.reducer';
import { ChainEffects } from '@store/chain/chain.effects';

@NgModule({
  imports: [
    StoreModule.forRoot(
      {
        chain: chainReducer,
      },
      {
        runtimeChecks: {
          strictStateSerializability: true,
          strictActionSerializability: true,
          strictStateImmutability: true,
          strictActionImmutability: true,
          strictActionTypeUniqueness: true
        }
      }
    ),
    EffectsModule.forRoot([
      ChainEffects
    ]),
    StoreDevtoolsModule.instrument()
  ]
})
export class AppStoreModule {
}
