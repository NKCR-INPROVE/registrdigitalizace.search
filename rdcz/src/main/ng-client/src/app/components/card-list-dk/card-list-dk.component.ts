import {Component, OnInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {AppService} from '../../app.service';
import {AppState} from '../../app.state';
import { Filter } from '../../models/filter';

@Component({
  selector: 'app-card-list-dk',
  templateUrl: './card-list-dk.component.html',
  styleUrls: ['./card-list-dk.component.scss']
})
export class CardListDkComponent implements OnInit, OnDestroy {

  subscriptions: Subscription[] = [];
  digknihovny: any[] = [];



  constructor(
    private service: AppService, 
    public state: AppState) {
  }


  ngOnInit() {
    if (this.state.config) {
      this.getData();
    } else {
      this.subscriptions.push(this.service.langSubject.subscribe(
        () => {
          this.getData();
        }
      ));
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }

  getData() {
    this.service.getDigKnihovny().subscribe(res => {
      this.digknihovny = res;
      this.digknihovny.forEach(dg => {
        if(dg['poznweb'] && dg['poznweb'] !== ''){
          dg['sigly'] = dg['poznweb'].split(',');
        }
      });
    })
  }
  
  filter(dg: string){
//    let url1: string = dg['url'].replace(/:/g, '\\:') + '*';
    let f = new Filter();
    f.field = 'digknihovna';
    f.value = dg['nazev'].trim();
    this.state.addFilter(f);
//    this.state.q = 'url:' + url1.trim();
    this.service.goToResults();
  }
}
