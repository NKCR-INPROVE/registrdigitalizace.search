import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { AppState } from '../../../app.state';
import { AppService } from '../../../app.service';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnInit {
  subscriptions: Subscription[] = [];
//  numPages: number;
//  totalPages: number;
  @Output() onGotoPage: EventEmitter<number> = new EventEmitter<number>();
  
  pages: number[];
  current: number = 0;
  

  constructor(private service: AppService, public state: AppState) { }

  ngOnInit() {
    this.subscriptions.push(this.state.searchSubject.subscribe(
      (resp) => {
        if(resp['state'] === 'start'){
//          this.pages = [];
        } else {
          this.setPages();
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
  
  setPages(){
    this.pages = [];
    let pagesToShow = Math.min(this.state.numPages, this.state.totalPages);
    let min: number = Math.min(Math.max(0, this.current - Math.floor(pagesToShow / 2)), this.state.totalPages - pagesToShow);
    let max: number = min + pagesToShow;
    for(let i = min; i< max; i++){
      this.pages.push(i);
    }
    this.current = Math.ceil(this.state.start / this.state.rows);
  }
  
  prev(){
    this.current = Math.max(0, this.current - 1);
//    this.setPages();
    this.state.setPage(this.current);
  }
  next(){
    this.current = Math.min(this.current + 1, this.state.totalPages);
//    this.setPages();
    this.state.setPage(this.current);
  }
  gotoPage(p: number){
    this.current = p;
//    this.setPages();
    this.state.setPage(this.current);
  }
  
  

}
