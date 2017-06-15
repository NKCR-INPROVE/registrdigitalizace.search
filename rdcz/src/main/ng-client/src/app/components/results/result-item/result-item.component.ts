import { Component, OnInit, Input } from '@angular/core';

import { Result } from '../../../models/result';

@Component({
  selector: 'app-result-item',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.scss']
})
export class ResultItemComponent implements OnInit {
  
  @Input() result: Result;

  constructor() { }

  ngOnInit() {
  }

}
