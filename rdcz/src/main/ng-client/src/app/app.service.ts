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
  
  search(params : URLSearchParams, type: string = 'results'): void {
    this.state.startSearch(type);
    var url = this.state.config['context'] + 'search/rdcz/select';
    this.http.get(url, { search: params }).map(res => {
      this.state.processSearch(res.json(), type);
    }).subscribe();
  }
  
  getFromLists(classname: string, value: string): string {
    let output = 'qq';
    this.doGetFromLists(classname, value).subscribe(res => {
      //let r = res.json();
      output = res;
    }).unsubscribe();
    return output
  }

  
  doGetFromLists(classname: string, value: string): Observable<string> {
    let params: URLSearchParams = new URLSearchParams();
    params.set('q', 'value:"'+value+'"');
    params.set('fq', 'classname:"'+classname+'"');
    var url = this.state.config['context'] + 'search/lists/select';
    return this.http.get(url, { search: params }).map(res => {
      //let r = res.json();
      return res.json()['response']['docs'][0]['cz'];
    });
  }

}
