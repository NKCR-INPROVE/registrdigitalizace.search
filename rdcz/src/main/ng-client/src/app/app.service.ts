import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';

import {  Http, Response, URLSearchParams } from '@angular/http';

import { AppState } from './app.state';

@Injectable()
export class AppService {

  //Observe language
  public _langSubject = new Subject();
  public langSubject: Observable<any> = this._langSubject.asObservable();

  constructor(
    private state: AppState,
    private translate: TranslateService,
    private http: Http) { }
  
  
  changeLang(lang: string) {
    //console.log('lang changed to ' + lang);
    this.state.currentLang = lang;
    this.translate.use(lang);
    this._langSubject.next(lang);
  }
  
  translateKey(key){
    return this.translate.instant(key);
  }
  
  search(params : URLSearchParams) {
    var url = this.state.config['context'] + 'search/rdcz/select';
    return this.http.get(url, { search: params }).map(res => {
      return res.json();
    });
  }

}
