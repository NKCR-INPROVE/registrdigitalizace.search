import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { URLSearchParams } from '@angular/http';

import { AppService } from '../../../app.service';
import { AppState } from '../../../app.state';
import { Result } from '../../../models/result';

@Component({
  selector: 'app-result-item',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.scss']
})
export class ResultItemComponent implements OnInit, OnDestroy {

  @Input() result: Result;
  @Input() expanded: Result;
  subscriptions: Subscription[] = [];

  showingDetail: boolean = false;
  predlohy: Result[] = [];
  digObjects: any[] = [];
  predlohyLoaded: boolean = false;
  hasImg : boolean = false;
  imgSrc: string;
  imgWidth: number = 100;

  currentSort: string = 'stav';
  currentDir: number = 1;

  stavy = [];
  vlastniky = [];

  constructor(private service: AppService, public state: AppState) { }

  ngOnInit() {
    if (this.result) {
      this.getPredlohy();
      this.getDigObjects();
    }

    this.subscriptions.push(this.state.searchSubject.subscribe(
      (resp) => {
        if (resp['type'].indexOf(this.result[this.state.currentCollapse.field]) > -1) {
          if (resp['state'] === 'start') {
          } else {
            this.stavy = [];
            resp['res']["facet_counts"]["facet_fields"]['stav'].forEach((a) => {
              this.stavy.push(a[0]);
            });
            
            this.vlastniky = [];
            resp['res']["facet_counts"]["facet_fields"]['vlastnik'].forEach((a) => {
              this.vlastniky.push({sigla: a[0], count: a[1], active: true});
            });
            
            this.predlohy = resp['res']["response"]["docs"];
            
            this.predlohy.forEach(p => {
              if(p['url']){
                this.digObjects.push({url: p['url']});
              }
            });
            this.sortDefault();
            this.setActiveByVlastnik();
            $("#t_"+this.result.id).tableHeadFixer();
          }

        }
      }
    ));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }

  translate(classname, value) {
    return this.service.translateFromLists(classname, value);
  }
  
  toggleVlastnik(vlastnik: any){
//    vlastnik['active'] = !vlastnik['active'];
    this.setActiveByVlastnik();
  }
  
  isActiveVlastnik(sigla: string): boolean{
    for (let i in this.vlastniky){
      if(this.vlastniky[i]['sigla'] === sigla){
        return this.vlastniky[i]['active'];
      }
    }
    return true;
  }
  
  setActiveByVlastnik(){
    this.predlohy.forEach(p => {
      p['active'] = this.isActiveVlastnik(p['vlastnik']);
    });
  }
  
  getDigObjects() {
    if (this.result) {
      
        let params: URLSearchParams = new URLSearchParams();
        if(this.state.currentCollapse.field === 'id'){
          params.set('q', 'rpredloha_digobjekt:"' + this.result[this.state.currentCollapse.field] + '"');
        } else {
          params.set('q', this.state.currentCollapse.field + ':"' + this.result[this.state.currentCollapse.field] + '"');
        }
        
        params.set('rows', '100');

        this.service.getDigObjects(params).subscribe(res => {
          for(let i in res['response']['docs']){
            //this.digObjects.push(res['response']['docs'][i]);
            let dourl = res['response']['docs'][i]['urldigknihovny'] +'/search/handle/uuid:' + res['response']['docs'][i]['uuid'];
            this.digObjects.push({url: dourl});
          }
          if (res['response']['docs'].length > 0){
            this.hasImg = true;
            this.imgSrc = res['response']['docs'][0]['urldigknihovny'] +
             '/search/img?stream=IMG_THUMB&action=SCALE&scaledWidth='+ this.imgWidth +'&uuid=uuid:' + 
             res['response']['docs'][0]['uuid']
          }
          
        });
      
      //this.predlohyLoaded = true;
    }
  }

  getPredlohy() {
    if (this.result) {
      if (this.expanded) {
        let params: URLSearchParams = new URLSearchParams();
        params.set('q', this.state.currentCollapse.field + ':"' + this.result[this.state.currentCollapse.field] + '"');
        params.set('rows', (this.expanded['numFound'] + 1) + '');
        params.set('facet', 'true');
        params.set('facet.mincount', '1');
        params.append('facet.field', 'stav');
        params.append('facet.field', 'vlastnik');

        this.service.search(params, this.result[this.state.currentCollapse.field]);
      } else {
        this.predlohy.push(this.result);
        this.stavy.push(this.result['stav']);
        this.vlastniky.push({sigla: this.result['vlastnik'], count: 1, active: true});
        this.predlohy[0]['active'] = true;
        if(this.predlohy[0]['url']){
          this.digObjects.push({url: this.predlohy[0]['url']});
        }
      }
      this.predlohyLoaded = true;
    }
  }

  /**
   * Vychozi mame radit takhle
   *  Ideální stav by bylo použití dvoustupňového řazení (stačil by u vlastníka a roku)
   */
  sortDefault() {
    this.currentSort = null;
    this.predlohy.sort((a: Result, b: Result) => {
      let v: string = a['vlastnik'];
      if (v.localeCompare(b['vlastnik']) === 0){
        if(a['rozsah'] && b['rozsah']){
          return a['rozsah'].localeCompare(b['rozsah']);
        } else if(a['cast'] && b['cast']){
          return a['cast'].localeCompare(b['cast']);
        } else {
          return 0;
        }
        
      } else {
        return v.localeCompare(b['vlastnik']);
      }
    });
  }

  sortBy(field: string) {
    this.currentSort = field;
    this.currentDir = - this.currentDir;
    this.predlohy.sort((a: Result, b: Result) => {
      return a[field] > b[field] ? -this.currentDir : this.currentDir;
    });
  }


  // toggle content function by id
  toggleDetail(id) {
    if (!this.predlohyLoaded) {
      this.getPredlohy();
    }
    this.showingDetail = !this.showingDetail;
    $('#' + id + '-btn').toggleClass('active');
    $('#' + id).slideToggle("fast");
  }
   
   // jquery table fixed header plugin -> https://www.npmjs.com/package/jquery-table-fixed-header
   // $(".app-table-predlohy").tableFixedHeader();
   /*$("#fixTable").tableHeadFixer();*/
}
