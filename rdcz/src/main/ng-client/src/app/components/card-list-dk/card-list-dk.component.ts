import {Component, OnInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import {URLSearchParams} from '@angular/http';

import {AppService} from '../../app.service';
import {AppState} from '../../app.state';
import {FacetField} from '../../models/facet-field';

@Component({
  selector: 'app-card-list-dk',
  templateUrl: './card-list-dk.component.html',
  styleUrls: ['./card-list-dk.component.scss']
})
export class CardListDkComponent {

  subscriptions: Subscription[] = [];
  digknihovny: any[] = [];



  constructor(private service: AppService, public state: AppState) {
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
    })
  }
  
  filter(dg: any){
    
  }
}
