import { Component, OnInit, Input } from '@angular/core';
import { AppState } from '../../../app.state';

@Component({
  selector: 'app-menu-tree',
  templateUrl: './menu-tree.component.html',
  styleUrls: ['./menu-tree.component.scss']
})
export class MenuTreeComponent implements OnInit {
  
  @Input('dir') dir: any;
  @Input('path') path: string;

  constructor(
    public state: AppState) { }

  ngOnInit() {
    console.log(this.dir);
  }

  select(f: string) {
    let s = this.path + '/' + this.dir['name'] + '/' + f;
    this.state.setSelectAdminItem(s);
  }
  
  isActive(f:string){
    let s = this.path + '/' + this.dir['name'] + '/' + f;
    return this.state.selectAdminItem === s;
  }
  
  addPage(){
    this.dir['files'].push('newpage');
  }
  
  addFolder(){
    this.dir['dirs'].push({name: 'newfolder', files:[], dirs:[]});
  }


}
