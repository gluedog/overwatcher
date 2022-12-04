import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { EffectsModule } from '@ngrx/effects';
import { AppStoreModule } from '@store/app-store.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TxTableComponent } from '@components/tx-table/tx-table.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChainService } from '@services/chain.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { chainReducer } from '@store/chain/chain.reducer';
import { ChainEffects } from '@store/chain/chain.effects';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RulesModalComponent } from '@components/rules-modal/rules-modal.component';
import { MatDialogModule } from '@angular/material/dialog';

const material = [
  MatSliderModule,
  MatTableModule,
  MatButtonModule,
  MatSlideToggleModule,
  MatSelectModule,
  MatProgressBarModule,
  MatFormFieldModule,
  MatInputModule,
  MatTooltipModule,
  MatCheckboxModule,
  MatDialogModule
]

@NgModule({
  declarations: [
    AppComponent,
    TxTableComponent,
    RulesModalComponent
  ],
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
    StoreDevtoolsModule.instrument(),

    BrowserModule,
    AppRoutingModule,
    // StoreModule.forRoot({}, {}),
    // StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production }),
    // EffectsModule.forRoot([]),
    BrowserAnimationsModule,
    ...material,
    FormsModule,
    ReactiveFormsModule,
    ScrollingModule,
    HttpClientModule
  ],
  providers: [
    ChainService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
