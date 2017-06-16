import { Component, OnInit } from '@angular/core';

import { AppState } from '../../../app.state';
import { AppService } from '../../../app.service';
import { Filter } from '../../../models/filter';

@Component({
  selector: 'app-used-filters',
  templateUrl: './used-filters.component.html',
  styleUrls: ['./used-filters.component.scss']
})
export class UsedFiltersComponent implements OnInit {

  constructor(public state: AppState, public service: AppService) { }

  ngOnInit() {
  }
  
  remove(f: Filter){
    this.state.removeFilter(f);
  }

}
