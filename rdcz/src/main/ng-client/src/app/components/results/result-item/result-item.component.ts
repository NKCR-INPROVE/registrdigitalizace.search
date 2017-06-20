import { Component, OnInit, Input } from '@angular/core';

import { Result } from '../../../models/result';

@Component({
  selector: 'app-result-item',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.scss']
})
export class ResultItemComponent implements OnInit {
  
  @Input() result: Result;
  
  showingDetail: boolean = false;

  constructor() { }

  ngOnInit() {
  }
  
  
  // toggle content function by id
  toggleDetail(id){
    this.showingDetail = !this.showingDetail;
    $('#'+id+'-btn').toggleClass('active');
    $('#'+id).slideToggle( "fast" );
  }
}
