import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import { MaterializeModule } from 'ng2-materialize'; // _app

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { InfoComponent } from './components/info/info.component';
import { NapovedaComponent } from './components/napoveda/napoveda.component';
import { ResultsComponent } from './components/results/results.component';
import { FacetsComponent } from './components/results/facets/facets.component';
import { PaginationComponent } from './components/results/pagination/pagination.component';
import { CountBarComponent } from './components/results/count-bar/count-bar.component';
import { ChartBarComponent } from './components/results/chart-bar/chart-bar.component';
import { SortBarComponent } from './components/results/sort-bar/sort-bar.component';
import { ResultItemComponent } from './components/results/result-item/result-item.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    InfoComponent,
    NapovedaComponent,
    ResultsComponent,
    FacetsComponent,
    PaginationComponent,
    CountBarComponent,
    ChartBarComponent,
    SortBarComponent,
    ResultItemComponent,
    SearchBarComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    MaterializeModule.forRoot(), // _app
    RouterModule.forRoot([
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'results', component: ResultsComponent },
      { path: 'info', component: InfoComponent },
      { path: 'napoveda', component: NapovedaComponent }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
