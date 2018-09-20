import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';

import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

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
    private http: HttpClient) { }


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
  
  doHomeSearchParams(boosted: boolean = true): HttpParams  {
    
    let params: HttpParams = new HttpParams();
    params = params.set('q', '*');
    params = params.set('facet', 'true');
    params = params.set('facet.mincount', '1');
    for (let i in this.state.config['facets']) {
        params = params.append('facet.field', this.state.config['facets'][i]['field']);
    }
    params = params.set('facet.range', 'rokvyd');
    params = params.set('facet.range.start', '1');
    params = params.set('facet.range.end', (new Date()).getFullYear() + '');
    params = params.set('facet.range.gap', '10');

    params = params.set('rows', '0');
    this.state.clearParams();
    return params
  }

  doSearchParams(sroute: string, boosted: boolean = true, mm: string = '100%'): HttpParams {
    
    if(sroute === 'home'){
      return this.doHomeSearchParams(false);
    }
    let params: HttpParams = new HttpParams();
    if (this.state.q && this.state.q !== '') {
      params = params.set('q', this.state.q);
    } else {
      params = params.set('q', '*');
    }

    params = params.set('start', this.state.start + '');
    params = params.set('rows', this.state.rows + '');
    params = params.set('sort', this.state.currentSort.field);
    params = params.set('facet', 'true');
    params = params.set('facet.mincount', '1');
    for (let i in this.state.config['facets']) {
      params = params.append('facet.field', this.state.config['facets'][i]['field']);
    }

    params = params.set('facet.range', '{!ex=rk}rokvyd');
    
//    params.set('facet.range.start', this.state.currentOd + '');
//    params.set('facet.range.end', this.state.currentDo + '');
    
    params = params.set('facet.range.start', '0');
    params = params.set('facet.range.end', (new Date()).getFullYear() + '');
    params = params.set('facet.range.gap', '10');
    
    if(boosted){
      params = params.set('qf', this.state.config['boost']['qf']);
    }
    params = params.set('mm', mm);

      
    for (let i in this.state.usedFilters) {
      if(this.state.usedFilters[i].field === 'rokvyd'){
        //let vals = this.state.usedFilters[i].value
        let fq = '[' + this.state.currentOd + ' TO ' + this.state.currentDo + '}';
        params = params.append('fq', '{!tag=rk}rokvyd:' + fq);
      } else {
        params = params.append('fq', this.state.usedFilters[i].field + ':"' + this.state.usedFilters[i].value + '"');
      }
    }
    
    
    for(let i in this.state.advParams){
      if(this.state.advParams[i] !== null && this.state.advParams[i] !== ''){
        if(i === 'title'){
          
          params = params.append('fq', 'title:"' + this.state.advParams[i].trim() +
           '" OR title_prefix:"' + this.state.advParams[i].trim() +
           '" OR varnazev:"' + this.state.advParams[i].trim() + '"');
          if (boosted && (!this.state.q || this.state.q === '')) {
//            params.set('bq', 'title_full:"' + this.state.advParams[i].trim() +
//             '"^5.0 title_nolemmas:"' + this.state.advParams[i].trim() +
//              '"^2.0 varnazev:"' + this.state.advParams[i].trim() +
//               '"^1.1 title_prefix:"' + this.state.advParams[i].trim() +
//                '"^4.0 title:"' + this.state.advParams[i].trim() + '"^1.5 ');
            params = params.set('q', this.state.advParams[i].trim());
                
          }
        }else if(i === 'ccnb'){
          params = params.append('fq', 'ccnb:"' + this.state.advParams[i].trim() +
           '" OR nep_ccnb:"' + this.state.advParams[i].trim() + '"');
        }else{
          params = params.append('fq', i + ':"' + this.state.advParams[i].trim() + '"');
        }
      }
    }

    if (this.state.currentCollapse['field'] !== 'id') {
      params = params.append('fq', '{!collapse field=' + this.state.currentCollapse['field'] + ' sort=\'vlastnik asc\'}');
      params = params.append('expand', 'true');
      params = params.append('expand.rows', '1');
      
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

  search(params: HttpParams, type: string = 'results'): Observable<Object> {
    this.state.startSearch(type);
    var url = this.state.config['context'] + 'search/rdcz/select';
    return this.http.get(url, { params: params });
  }
  
  getDigObjects(params: HttpParams){
    var url = this.state.config['context'] + 'search/digobjekt/select';
    return this.http.get(url, { params: params });
    
  }
  
  searchAleph(){
    var url = this.state.config['context'] + 'aleph';
    let params: HttpParams = new HttpParams().set('bc', this.state.q)
    return this.http.get(url, { params: params });
  }
  
  searchAlephDirect(){
    var url = this.state.config['context'] + 'alephDirect';
    let params: HttpParams = new HttpParams().set('base', 'nkc').set('op', 'find').set('request', 'bc='+this.state.q);
    return this.http.get(url, { params: params }).map((res: Response) => {
      
      return JSON.parse(xml2json(res.text(), ''));
      //return res.text();
    });
  }
  
  getFromAleph(set_no: string, no_records:string){
    var url = this.state.config['context'] + 'aleph';
    let params: HttpParams = new HttpParams();
        
    params = params.set('op', 'present');
    params = params.set('format', 'marc');
    params = params.set('set_no', set_no);
    params = params.set('set_entry', '1-' +no_records);
    return this.http.get(url, { params: params }).map((res: Response) => {
      
      return JSON.parse(xml2json(res.text(), ''));
      //return res.text();
    });
  }
  
  goToResults(): void {
    let params = this.doUrlParams();
    //this.state.clearResults();
    this.router.navigate(['/results', params]);
  }
  
  getDigKnihovnu(nazev: string): Observable<any> {
    let params: HttpParams = new HttpParams();
    params = params.set('q', 'nazev:"' + nazev +'" OR zkratka:"' + nazev +'"');
    params = params.set('rows', '1');
    var url = this.state.config['context'] + 'search/digknihovny/select';
    return this.http.get(url, { params: params }).map(res => {
      return res['response']['docs'][0];
    });
  }
  
  getDigKnihovnyCount(nazev: string): Observable<number> {
    let params: HttpParams = new HttpParams();
    params = params.set('q', 'digknihovna:"' + nazev +'"');
    params = params.set('rows', '0');
    var url = this.state.config['context'] + 'search/rdcz/select';
    return this.http.get(url, { params: params }).map(res => {
      return res['response']['numFound'];
    });
  }

  getDigKnihovny(): Observable<any> {
    let params: HttpParams = new HttpParams();
    params = params.set('q', '*');
    params = params.set('rows', '1000');
//    params.set('sort', 'nazev asc');
    var url = this.state.config['context'] + 'search/digknihovny/select';
    return this.http.get(url, { params: params }).map(res => {
      return res['response']['docs'];
    });
  }

  getLists(): Observable<any> {
    let params: HttpParams = new HttpParams();
    params = params.set('q', '*');
    let classes = 'dummyvalue'
    for (let i in this.state.config['facets']) {
      if(this.state.config['facets'][i]['classname']){
        classes += ' OR classname:"' + this.state.config['facets'][i]['classname'] + '"'
      }
    }
    params = params.append('fq', classes);
    params = params.set('rows', '1000');
    var url = this.state.config['context'] + 'search/lists/select';
    return this.http.get(url, { params: params }).map(res => {
      return res['response']['docs'];
    });
  }
  
  getEditablePages(): Observable<any>{
    var url = 'texts?action=LIST&lang=' + this.state.currentLang;

    return this.http.get(url);
  }
  
  
  getText(id: string): Observable<string> {
    var url = 'texts?action=LOAD&id=' + id + '&lang=' + this.state.currentLang;
    return this.http.get(url, {responseType: 'text'}).map((response) => {
      return response;
    }).catch(error => { return Observable.of('error gettting content: ' + error); });
  }

  saveText(id: string, text: string): Observable<string> {
    var url = 'texts?action=SAVE&id=' + id + '&lang=' + this.state.currentLang;

    let headers = new HttpHeaders({ 'Content-Type': 'text/plain;charset=UTF-8' });
    const options = { headers: headers };
    
    //we should convert back routerlink= to routerLink=
    
    let ctext = text.replace(/routerlink/g, 'routerLink');//.replace(/fragment/g, '[fragment]');

    return this.http.post<string>(url, ctext, options);
    // .catch(error => { return Observable.of('error saving content: ' + error); });

  }

  saveMenu(menu: any): Observable<string> {
    let params: HttpParams = new HttpParams()
      .append('action', 'SAVEMENU')
      .append('menu', JSON.stringify(this.state.info_menu));
    var url = 'texts';
    return this.http.get<string>(url, { params: params });
//      .map((response: Response) => {
//        return response;
//
//      }).catch(error => { return Observable.of('error saving content: ' + error); });

  }

  login() {
    this.state.loginError = false;
//    if(1<2){
//        this.state.loginError = false;
//        this.state.loginuser = '';
//        this.state.loginpwd = '';
//        this.state.logged = true;
//        if (this.state.redirectUrl) {
//          this.router.navigate([this.state.redirectUrl]);
//        }
//        return;
//    }
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
    var params = new HttpParams()
    .set('user', this.state.loginuser)
    .set('pwd', this.state.loginpwd)
    .set('action', 'LOGIN');
    return this.http.get(url, { params: params }).map(res => {
      return res;
    }, error => {
      console.log('error : ' + error);
    });

  }

  logout() {
    this.doLogout().subscribe(res => {
      if (res.hasOwnProperty('error')) {
        console.log(res['error']);
      }
      this.state.loginError = false;
      this.state.logged = false;
      this.router.navigate(['/home']);
    });
  }

  doLogout() {

    var url = 'login';
    //console.log(this.loginuser, this.loginpwd, url);
    var params = new HttpParams().set('action', 'LOGOUT');
    return this.http.get(url, { params: params });

  }
  
  removeAlephChars(s: string): string{
    let ret = s.trim();
    return ret;
  }

}
