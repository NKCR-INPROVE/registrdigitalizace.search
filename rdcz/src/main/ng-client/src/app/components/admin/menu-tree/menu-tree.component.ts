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

  select(f: string) {
    let s = this.path + '/' + this.dir['name'] + '/' + f;
    this.state.setSelectAdminItem(s);
  }

  isActive(f: string) {
    let s = this.path + '/' + this.dir['name'] + '/' + f;
    return this.state.selectAdminItem === s;
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
