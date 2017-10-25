import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Http, URLSearchParams } from '@angular/http';
import { ActivatedRoute, Router, Params, NavigationEnd, NavigationStart } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';

import { AppService } from './app.service';
import { AppState } from './app.state';
import { Filter } from './models/filter';

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
    private http: Http,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit() {
    this.processUrl();
    this.getConfig().subscribe(cfg => { });

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
      let sparams: URLSearchParams = this.service.doSearchParams(sroute);
      this.service.search(sparams, sroute);
    }
  }

  getConfig() {
    return this.http.get("assets/config.json").map(res => {
      let cfg = res.json();
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
      this.service.getEditablePages().subscribe(res => {
        this.state.config['editable_pages'] = res;
      });
      return this.state.config;
    });
  }

}
