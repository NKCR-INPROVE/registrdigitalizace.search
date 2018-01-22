import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, Params, NavigationStart, NavigationEnd, NavigationExtras } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';

import { Http, Response, URLSearchParams, Headers, RequestOptions } from '@angular/http';

import { AppState } from './app.state';
import { ListValue } from './models/list-value';


declare var xml2json: any;

@Injectable()
export class AppService {

  //Observe language
  public _langSubject = new Subject();
  public langSubject: Observable<any> = this._langSubject.asObservable();

  constructor(
    private state: AppState,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private http: Http) { }


  changeLang(lang: string) {
    //console.log('lang changed to ' + lang);
    this.state.currentLang = lang;
    this.translate.use(lang);
    this._langSubject.next(lang);
  }

  translateKey(key) {
    return this.translate.instant(key);
  }

  translateFromLists(classname: string, key: string): string {
    //console.log(this.state.lists, key, classname);
    if (this.state.lists &&
      this.state.lists.hasOwnProperty(classname +'_'+key)) {
      let listValue: ListValue = this.state.lists[classname + '_' + key];

      // find the lang in lists
      let lang = this.state.config['langMaps'].hasOwnProperty(this.state.currentLang) ?
        this.state.config['langMaps'][this.state.currentLang] : this.state.currentLang;
      if (listValue.hasOwnProperty(lang)) {
        return listValue[lang];
      } else if (listValue.cz) {
        return listValue.cz;
      } else {
        return key;
      }

    } else {
      return key;
    }
  }
  
  doHomeSearchParams(boosted: boolean = true): URLSearchParams {
    
    let params: URLSearchParams = new URLSearchParams();
    params.set('q', '*');
    params.set('facet', 'true');
    params.set('facet.mincount', '1');
    for (let i in this.state.config['facets']) {
        params.append('facet.field', this.state.config['facets'][i]['field']);
    }
    params.set('facet.range', 'rokvyd');
    params.set('facet.range.start', '1');
    params.set('facet.range.end', (new Date()).getFullYear() + '');
    params.set('facet.range.gap', '10');

    params.set('rows', '0');
    this.state.clearParams();
    return params
  }

  doSearchParams(sroute: string, boosted: boolean = true, mm: string = '100%'): URLSearchParams {
    
    if(sroute === 'home'){
      return this.doHomeSearchParams(false);
    }
    let params: URLSearchParams = new URLSearchParams();
    if (this.state.q && this.state.q !== '') {
      params.set('q', this.state.q);
    } else {
      params.set('q', '*');
    }

    params.set('start', this.state.start + '');
    params.set('rows', this.state.rows + '');
    params.set('sort', this.state.currentSort.field);
    params.set('facet', 'true');
    params.set('facet.mincount', '1');
    for (let i in this.state.config['facets']) {
      params.append('facet.field', this.state.config['facets'][i]['field']);
    }

    params.set('facet.range', '{!ex=rk}rokvyd');
    
//    params.set('facet.range.start', this.state.currentOd + '');
//    params.set('facet.range.end', this.state.currentDo + '');
    
    params.set('facet.range.start', '0');
    params.set('facet.range.end', (new Date()).getFullYear() + '');
    params.set('facet.range.gap', '10');
    
    if(boosted){
      params.set('qf', this.state.config['boost']['qf']);
    }
    params.set('mm', mm);

      
    for (let i in this.state.usedFilters) {
      if(this.state.usedFilters[i].field === 'rokvyd'){
        //let vals = this.state.usedFilters[i].value
        let fq = '[' + this.state.currentOd + ' TO ' + this.state.currentDo + '}';
        params.append('fq', '{!tag=rk}rokvyd:' + fq);
      } else {
        params.append('fq', this.state.usedFilters[i].field + ':"' + this.state.usedFilters[i].value + '"');
      }
    }
    
    
    for(let i in this.state.advParams){
      if(this.state.advParams[i] !== null && this.state.advParams[i] !== ''){
        if(i === 'title'){
          params.append('fq', 'title:"' + this.state.advParams[i].trim() + '" OR varnazev:"' + this.state.advParams[i].trim() + '"');
        }else{
          params.append('fq', i + ':"' + this.state.advParams[i].trim() + '"');
        }
        
      }
    }
    

    if (this.state.currentCollapse['field'] !== 'id') {
      params.append('fq', '{!collapse field=' + this.state.currentCollapse['field'] + '}');
      params.append('expand', 'true');
      params.append('expand.rows', '1');
    }
    
    return params;
  }

  doUrlParams():  NavigationExtras {
    let params = {};
    if (this.state.q && this.state.q !== '') {
      params['q'] = this.state.q;
    } else {
      params['q'] =  '*';
    }

    params['start'] =  this.state.start;
    params['rows'] =  this.state.rows;
    params['sort'] = this.state.currentSort.field;
    
    //params['filters'] = [];
    params['filters'] = JSON.stringify(this.state.usedFilters);
    
//    params['od'] = this.state.currentOd;
//    params['do'] = this.state.currentDo;
    
    params['adv'] = JSON.stringify(this.state.advParams);
    
    params['collapse'] =  this.state.currentCollapse['field'];
    return params;
  }

  search(params: URLSearchParams, type: string = 'results'): void {
    this.state.startSearch(type);
    var url = this.state.config['context'] + 'search/rdcz/select';
    this.http.get(url, { search: params }).map(res => {
      this.state.processSearch(res.json(), type);
    }).subscribe();
  }
  
  getDigObjects(params: URLSearchParams){
    var url = this.state.config['context'] + 'search/digobjekt/select';
    return this.http.get(url, { search: params }).map((res: Response) => {
      return res.json();
    });
    
  }
  
  searchAleph(){
    var url = this.state.config['context'] + 'aleph';
    let params: URLSearchParams = new URLSearchParams();
    params.set('bc', this.state.q)
    return this.http.get(url, { search: params }).map((res: Response) => {
      
      return res.json();
      //return res.text();
    });
  }
  
  searchAlephDirect(){
    var url = this.state.config['context'] + 'alephDirect';
    let params: URLSearchParams = new URLSearchParams();
    params.set('base', 'nkc');
    params.set('op', 'find');
    params.set('request', 'bc='+this.state.q);
    return this.http.get(url, { search: params }).map((res: Response) => {
      
      return JSON.parse(xml2json(res.text(), ''));
      //return res.text();
    });
  }
  
  getFromAleph(set_no: string, no_records:string){
    var url = this.state.config['context'] + 'aleph';
    let params: URLSearchParams = new URLSearchParams();
        
    params.set('op', 'present');
    params.set('format', 'marc');
    params.set('set_no', set_no);
    params.set('set_entry', '1-' +no_records);
    return this.http.get(url, { search: params }).map((res: Response) => {
      
      return JSON.parse(xml2json(res.text(), ''));
      //return res.text();
    });
  }
  
  goToResults(): void {
    let params = this.doUrlParams();
    //this.state.clearResults();
    this.router.navigate(['/results', params]);
  }

  getLists(): Observable<any> {
    let params: URLSearchParams = new URLSearchParams();
    params.set('q', '*');
    let classes = 'dummyvalue'
    for (let i in this.state.config['facets']) {
      if(this.state.config['facets'][i]['classname']){
        classes += ' OR classname:"' + this.state.config['facets'][i]['classname'] + '"'
      }
    }
    params.append('fq', classes);
    params.set('rows', '1000');
    var url = this.state.config['context'] + 'search/lists/select';
    return this.http.get(url, { search: params }).map(res => {
      return res.json()['response']['docs'];
    });
  }
  
  getEditablePages(): Observable<any>{
    var url = 'texts?action=LIST&lang=' + this.state.currentLang;

    return this.http.get(url).map((response: Response) => {
      return response.json();
    }).catch(error => { return Observable.of('error gettting content: ' + error); });
  }
  
  
  getText(id: string): Observable<string> {
    var url = 'texts?action=LOAD&id=' + id + '&lang=' + this.state.currentLang;

    return this.http.get(url).map((response: Response) => {
      return response.text();
    }).catch(error => { return Observable.of('error gettting content: ' + error); });
  }

  saveText(id: string, text: string): Observable<string> {
    var url = 'texts?action=SAVE&id=' + id + '&lang=' + this.state.currentLang;

    let headers = new Headers({ 'Content-Type': 'text/plain;charset=UTF-8' });
    let options = new RequestOptions({ headers: headers });
    
    //we should convert back routerlink= to routerLink=
    
    let ctext = text.replace(/routerlink/g, 'routerLink');//.replace(/fragment/g, '[fragment]');

    return this.http.post(url, ctext, options)
      .map((response: Response) => {
        return response.json();

      }).catch(error => { return Observable.of('error saving content: ' + error); });

  }

  saveMenu(menu: any): Observable<string> {
    let params: URLSearchParams = new URLSearchParams();
    params.append('action', 'SAVEMENU');
    params.append('menu', JSON.stringify(this.state.info_menu));
    var url = 'texts';
    return this.http.get(url, { search: params })
      .map((response: Response) => {
        return response.json();

      }).catch(error => { return Observable.of('error saving content: ' + error); });

  }

  login() {
    this.state.loginError = false;
    if(1<2){
        this.state.loginError = false;
        this.state.loginuser = '';
        this.state.loginpwd = '';
        this.state.logged = true;
        if (this.state.redirectUrl) {
          this.router.navigate([this.state.redirectUrl]);
        }
        return;
    }
    return this.doLogin().subscribe(res => {
      if (res.hasOwnProperty('error')) {
        this.state.loginError = true;
        this.state.logged = false;
      } else {
      
        this.state.loginError = false;
        this.state.loginuser = '';
        this.state.loginpwd = '';
        this.state.logged = true;
        if (this.state.redirectUrl) {
          this.router.navigate([this.state.redirectUrl]);
        }
      }
    });
  }

  doLogin() {
    var url = 'login'
    var params = new URLSearchParams();
    params.set('user', this.state.loginuser);
    params.set('pwd', this.state.loginpwd);
    params.set('action', 'LOGIN');
    return this.http.get(url, { search: params }).map(res => {
      return res.json();
    }, error => {
      console.log('error : ' + error);
    });

  }

  logout() {
    this.doLogout().subscribe(res => {
      if (res.hasOwnProperty('error')) {
        console.log(res['error']);
      }
      this.state.logged = false;
      this.router.navigate(['/home']);
    });
  }

  doLogout() {

    var url = 'login';
    //console.log(this.loginuser, this.loginpwd, url);
    var params = new URLSearchParams();
    params.set('action', 'LOGOUT');
    return this.http.get(url, { search: params }).map(res => {
      return res.json();
    });

  }

}
