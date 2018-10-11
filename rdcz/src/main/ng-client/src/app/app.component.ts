import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {HttpClient, HttpParams} from '@angular/common/http';
//import { URLSearchParams } from '@angular/http';
import {ActivatedRoute, Router, Params, NavigationEnd, NavigationStart} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Rx';
import {Subscription} from 'rxjs/Subscription';

import {AppService} from './app.service';
import {AppState} from './app.state';
import {Filter} from './models/filter';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  init: boolean = false;

  subscriptions: Subscription[] = [];

  constructor(
    public state: AppState,
    private service: AppService,
    private translate: TranslateService,
    private titleService: Title,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router) {}

  ngOnInit() {
    this.processUrl();
    this.getConfig().subscribe(cfg => {});

    this.service.langSubject.subscribe(() => {
      this.translate.get('title.app').subscribe((newTitle: string) => {
        this.titleService.setTitle(newTitle);
      });
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }


  processUrl() {

    this.subscriptions.push(this.route.params
      .switchMap((params: Params) => Observable.of(params['start'])).subscribe(start => {
        if (start) {

        }
      }));

    this.subscriptions.push(this.router.events.subscribe(val => {

      if (val instanceof NavigationEnd) {

        let params = this.route.snapshot.firstChild.params;
        this.state.setSearchParamsFromUrl(params);

        let sroute = this.route.snapshot.firstChild.url[0].path;
        this.fireSearch(sroute);

        if (window['ga']) {
          (<any> window).ga('set', 'page', val.urlAfterRedirects);
          (<any> window).ga('send', 'pageview');
        }
      } else if (val instanceof NavigationStart) {

      }
    }));

    //
    //    this.subscriptions.push(this.state.searchParamsChanged.subscribe(
    //      (resp) => {
    //        if (resp['state'] === 'start') {
    //
    //        } else {
    //          //this.getData();
    //          this.service.goToResults();
    //        }
    //      }
    //    ));
  }

  fireSearch(sroute: string) {
    if (!this.state.configured) {
      setTimeout(() => {
        this.fireSearch(sroute);
      }, 10);
    } else {
      let sparams: HttpParams = this.service.doSearchParams(sroute, true);
      this.service.search(sparams, sroute).subscribe(res => {
        this.state.processSearch(res, sroute);
        if (sroute === 'results') {
          let fparams: HttpParams = this.service.doSearchParams('results', false)
            .set("rows", "0");
          this.service.search(fparams, 'facets').subscribe(res => {
            this.state.processSearch(res, 'facets');
          });
        }

      });
    }
  }

  getConfig() {
    return this.http.get("assets/config.json").map(res => {
      let cfg = res;
      var userLang = navigator.language.split('-')[0]; // use navigator lang if available
      userLang = /(cs|en)/gi.test(userLang) ? userLang : 'cs';
      if (cfg.hasOwnProperty('defaultLang')) {
        userLang = cfg['defaultLang'];
      }

      this.state.setConfig(cfg);
      this.service.getLists().subscribe(res => {
        for (let i in res) {
          this.state.lists[res[i]['classname'] + '_' + res[i]['value']] = res[i];
        }
        this.service.changeLang(userLang);
        this.state.stateChanged();
        this.init = true;
      });
      return this.state.config;
    });
  }

}
