import {Component, OnInit, OnDestroy, Input} from '@angular/core';
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
  @Input() digknihovny: any[] = [];

  constructor(
    private service: AppService, 
    public state: AppState) {
  }


  ngOnInit() {
    if (this.state.config) {
      this.getDigKnihovny();
    } else {
      this.subscriptions.push(this.service.langSubject.subscribe(
        () => {
          this.getDigKnihovny();
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

  getDigKnihovny() {
      this.digknihovny.forEach(dg => {
        this.service.getDigKnihovnu(dg[0].trim()).subscribe(res => {
          dg[2] = res;
        });
      });
  }

  getData() {
    this.service.getDigKnihovny().subscribe(res => {
      this.digknihovny = res;
      this.digknihovny.forEach(dg => {
        this.service.getDigKnihovnyCount(dg['zkratka'].trim()).subscribe(c => {
          dg['count'] = c;
        });
      });
    })
  }
  
  filter(dg: string){
//    let url1: string = dg['url'].replace(/:/g, '\\:') + '*';
    let f = new Filter();
    f.field = 'digknihovna';
    f.value = dg.trim();
    this.state.addFilter(f);
//    this.state.q = 'url:' + url1.trim();
    this.service.goToResults();
  }
}
