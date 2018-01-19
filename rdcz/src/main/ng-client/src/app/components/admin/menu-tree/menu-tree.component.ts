import {Component, OnInit, Input} from '@angular/core';
import {MzModalService} from 'ng2-materialize';
import {PromptComponent} from '../../prompt/prompt.component';

import {AppState} from '../../../app.state';

@Component({
  selector: 'app-menu-tree',
  templateUrl: './menu-tree.component.html',
  styleUrls: ['./menu-tree.component.scss']
})
export class MenuTreeComponent implements OnInit {

  @Input('dir') dir: any;
  @Input('path') path: string;

  constructor(
    private modalService: MzModalService,
    public state: AppState) {}

  ngOnInit() {
  }

  remove(f: any) {
    let s = {path: this.path, menuitem: f};
  }

  select(f: any) {
    let s = {path: this.path, menuitem: f};
    this.state.setSelectAdminItem(s);
  }

  isActive(f: string) {
    if(!this.state.selectAdminItem){
      return false;
    }
    let s = this.path + '/' + this.dir['name'] + '/' + f;
    return this.state.selectAdminItem['menuitem']['name'] === s;
  }

  addPage() {
    this.modalService.open(PromptComponent, {dir: this.dir, isFolder: false});
    //this.dir['files'].push('newpage');
  }
  
  addFolder() {
    this.modalService.open(PromptComponent, {dir: this.dir, isFolder: true});
    
//    this.dir['dirs'].push({name: 'newfolder', files: [], dirs: []});
  }


}
