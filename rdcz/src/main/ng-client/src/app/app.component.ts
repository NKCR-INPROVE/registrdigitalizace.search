import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Http } from '@angular/http';
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
    this.getConfig().subscribe(cfg => {
    });

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
  
  
  processUrl(){
    
    this.subscriptions.push(this.route.params
      .switchMap((params: Params) => Observable.of(params['start'])).subscribe(start => {
        if (start) {
          console.log('kk', start);
        }
      }));
      
//      
//    this.route.queryParams.subscribe(val => {
//      console.log('kk', val);
//    });
//    
    this.subscriptions.push(this.router.events.subscribe(val => {
      //console.log(val);
      if (val instanceof NavigationEnd) {
        let params = this.route.snapshot.firstChild.params;
        if (params.hasOwnProperty('q')) {
          this.state.start = params['q'];
        }
        if (params.hasOwnProperty('start')) {
          this.state.start = +params['start'];
        }
        if (params.hasOwnProperty('rows')) {
          this.state.rows = +params['rows'];
        }
        if (params.hasOwnProperty('filters')) {
          this.state.usedFilters = [];
          let f = params['filters'];
          if(f){
            let j = JSON.parse(params['filters']);
            for (let i in j) {
              let c: Filter = new Filter();
              Object.assign(c, j[i]);
              this.state.usedFilters.push(c);
            }
          }
          console.log(this.state.usedFilters);
        }
        if (params.hasOwnProperty('collapse')) {
          //console.log(params['collapse']);
          for (let i in this.state.collapses){
            if(this.state.collapses[i].field === params['collapse']){
              this.state.currentCollapse = this.state.collapses[i];
              break;
            }
          }
        }
      } else if (val instanceof NavigationStart) {

      }
    }));
  }

  getConfig() {
    return this.http.get("assets/config.json").map(res => {
      let cfg = res.json();

      this.state.rows = cfg['searchParams']['rows'];
      this.state.sorts = cfg['sorts'];
      this.state.currentSort = cfg[0];
      var userLang = navigator.language.split('-')[0]; // use navigator lang if available
      userLang = /(cs|en)/gi.test(userLang) ? userLang : 'cs';
      if (cfg.hasOwnProperty('defaultLang')) {
        userLang = cfg['defaultLang'];
      }
      
//      ////TODO
//      this.translate.setTranslation('en', {
//          HELLO: 'hello {{value}}'
//      });
      
      this.state.setConfig(cfg);
      this.service.getLists().subscribe(res => {
        for(let i in res){
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
