import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Http } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { AppService } from './app.service';
import { AppState } from './app.state';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  
  init: boolean = false;

  constructor(
    public state: AppState,
    private service: AppService,
    private translate: TranslateService,
    private titleService: Title,
    private http: Http,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit() {

    this.getConfig().subscribe();

    this.service.langSubject.subscribe(() => {
      this.translate.get('title.app').subscribe((newTitle: string) => {
        this.titleService.setTitle(newTitle);
      });
    });
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
