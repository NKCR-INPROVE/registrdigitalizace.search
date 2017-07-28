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

  currentSort: string = 'stav';
  currentDir: number = 1;

  stavy = [];

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

            this.predlohy = resp['res']["response"]["docs"];
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
  
  getDigObjects() {
    if (this.result) {
      
        let params: URLSearchParams = new URLSearchParams();
        params.set('q', this.state.currentCollapse.field + ':"' + this.result[this.state.currentCollapse.field] + '"');
        params.set('rows', '100');

        this.service.getDigObjects(params).subscribe(res => {
          this.digObjects = res['response']['docs'];
          if (this.digObjects.length > 0){
            this.hasImg = true;
            this.imgSrc = this.digObjects[0]['urldigknihovny'] +
             '/search/img?stream=IMG_THUMB&uuid=uuid:' + 
             this.digObjects[0]['uuid']
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

        this.service.search(params, this.result[this.state.currentCollapse.field]);
      } else {
        this.predlohy.push(this.result);
        this.stavy.push(this.result['stav']);
      }
      this.predlohyLoaded = true;
    }
  }

  sortBy(field: string, translated: boolean = false) {
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
}
