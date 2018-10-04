import {BrowserModule, Title} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClientModule, HttpClient} from '@angular/common/http';
import {RouterModule, RouteReuseStrategy} from '@angular/router';
//import { MdTableModule, MdSortModule } from '@angular/material'; // _app
//import { CdkTableModule } from '@angular/cdk'; // _app
import {BrowserAnimationsModule} from '@angular/platform-browser/animations'; // _app

import {MaterializeModule} from 'ng2-materialize'; // _app
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {NgProgressModule} from '@ngx-progressbar/core';

import {AppState} from './app.state';
import {AppService} from './app.service';

import {AppComponent} from './app.component';
import {HomeComponent} from './components/home/home.component';
import {HeaderComponent} from './components/header/header.component';
import {FooterComponent} from './components/footer/footer.component';
import {InfoComponent} from './components/info/info.component';
import {InfoMenuComponent} from './components/info/info-menu/info-menu.component';
import {NapovedaComponent} from './components/napoveda/napoveda.component';
import {ResultsComponent} from './components/results/results.component';
import {FacetsComponent} from './components/results/facets/facets.component';
import {PaginationComponent} from './components/results/pagination/pagination.component';
import {CountBarComponent} from './components/results/count-bar/count-bar.component';
import {ChartBarComponent} from './components/results/chart-bar/chart-bar.component';
import {SortBarComponent} from './components/results/sort-bar/sort-bar.component';
import {ResultItemComponent} from './components/results/result-item/result-item.component';
import {SearchBarComponent} from './components/search-bar/search-bar.component';
import {PieChartComponent} from './components/results/pie-chart/pie-chart.component';
import {JumbotronComponent} from './components/jumbotron/jumbotron.component';
import {DuplicityComponent} from './components/duplicity/duplicity.component';
import {FlotComponent} from './components/flot/flot.component';
import {UsedFiltersComponent} from './components/results/used-filters/used-filters.component';
import {QueryAsFilterComponent} from './components/results/query-as-filter/query-as-filter.component';
import {LoadingComponent} from './components/loading/loading.component';
import {LoginComponent} from './components/login/login.component';
import {AdminComponent} from './components/admin/admin.component';
import {AuthGuard} from "./auth-guard";
import {FreeTextComponent} from './components/free-text/free-text.component';
import {CardListDkComponent} from './components/card-list-dk/card-list-dk.component';
import {FacetsHomeComponent} from './components/facets-home/facets-home.component';
import {InnerContentComponent} from './components/inner-content/inner-content.component';
import {MenuTreeComponent} from './components/admin/menu-tree/menu-tree.component';
import {PromptComponent} from './components/prompt/prompt.component';
import {LinkListComponent} from './components/link-list/link-list.component';
import {InfoCollaborationBoxComponent} from './components/info-collaboration-box/info-collaboration-box.component';
import {CustomRouteReuseStrategy} from 'app/router-strategy';
import { AlephDialogComponent } from './components/aleph-dialog/aleph-dialog.component';


//export function HttpLoaderFactory(http: HttpClient) {
//  return new TranslateHttpLoader(http);
//}

export function createTranslateLoader(http: HttpClient) {
  //return new TranslateHttpLoader(http, './assets/i18n/', '.json');
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    InfoComponent,
    InfoMenuComponent,
    NapovedaComponent,
    ResultsComponent,
    FacetsComponent,
    PaginationComponent,
    CountBarComponent,
    SortBarComponent,
    ChartBarComponent,
    ResultItemComponent,
    SearchBarComponent,
    PieChartComponent,
    JumbotronComponent,
    DuplicityComponent,
    FlotComponent,
    UsedFiltersComponent,
    QueryAsFilterComponent,
    LoadingComponent,
    LoginComponent,
    AdminComponent,
    FreeTextComponent,
    CardListDkComponent,
    FacetsHomeComponent,
    InnerContentComponent,
    MenuTreeComponent,
    PromptComponent,
    LinkListComponent,
    InfoCollaborationBoxComponent,
    AlephDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    MaterializeModule.forRoot(), // _    app
    //    BrowserAnimationsModule, MdSortModule, CdkTableModule, MdTableModule, // _app

    NgProgressModule.forRoot(),

    RouterModule.forRoot([
      {path: '', redirectTo: 'home', pathMatch: 'full'},
      {path: 'home', component: HomeComponent},
      {path: 'results', component: ResultsComponent},
            { path: 'info/:page/:page', component: InfoComponent, data: {reuse: true} },
            { path: 'info/:page', component: InfoComponent, data: {reuse: true} },
            { path: 'info', component: InfoComponent, data: {reuse: true} },
//      {
//        path: 'info', component: InfoComponent,
//        children: [
//          {
//            path: '',
//            component: InfoComponent,
//          },
//          {
//            path: ':page',
//            component: InfoComponent,
//            children: [
//              {
//                path: '',
//                component: InfoComponent,
//              },
//              {
//                path: ':page',
//                component: InfoComponent,
//              }
//            ]
//          }
//        ]
//      },
      {path: 'napoveda', component: NapovedaComponent},
      {path: 'prihlaseni', component: LoginComponent},
      {
        path: 'admin',
        canActivate: [AuthGuard], component: AdminComponent
      },
      {path: 'duplicity', component: DuplicityComponent},
    ])
  ],
  entryComponents: [InnerContentComponent, PromptComponent, LinkListComponent, AlephDialogComponent],
  providers: [HttpClient, Title, AppState, AppService, AuthGuard, {
    provide: RouteReuseStrategy,
    useClass: CustomRouteReuseStrategy
  }],
  bootstrap: [AppComponent]
})
export class AppModule {}
