import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-menu-tree',
  templateUrl: './menu-tree.component.html',
  styleUrls: ['./menu-tree.component.scss']
})
export class MenuTreeComponent implements OnInit {
  
  @Input('dir') dir: any;

  constructor() { }

  ngOnInit() {
  }

}
