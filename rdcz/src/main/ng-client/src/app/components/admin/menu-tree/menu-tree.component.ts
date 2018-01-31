import {Component, OnInit, Input} from '@angular/core';
import {MzModalService} from 'ng2-materialize';
import {PromptComponent} from '../../prompt/prompt.component';

import {AppState} from '../../../app.state';
import {AppService} from 'app/app.service';

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
    private service: AppService,
    public state: AppState) {}

  ngOnInit() {
  }

  moveup(parent: any[], index: number) {
    if (index === 0) {
      return;
    }
    let clonedBottom = Object.assign({}, parent[index]);
    let clonedUp = Object.assign({}, parent[index - 1]);
    parent[index] = clonedUp;
    parent[index - 1] = clonedBottom;
    this.service.saveMenu(null).subscribe(res => {
      console.log(res);
    });
  }

  movedown(parent: any[], index: number) {
    if (index < parent.length - 1) {
      let clonedBottom = Object.assign({}, parent[index + 1]);
      let clonedUp = Object.assign({}, parent[index]);
      parent[index + 1] = clonedUp;
      parent[index] = clonedBottom;
      this.service.saveMenu(null).subscribe(res => {
        console.log(res);
      });
    }
  }

  remove(f: any[], index: number) {
    f.splice(index, 1);
    this.service.saveMenu(null).subscribe(res => {
      console.log(res);
    });
  }

  select(f: any) {
    let s = {path: this.path, menuitem: f};
    this.state.setSelectAdminItem(s);
  }

  isActive(f: string) {
    if (!this.state.selectAdminItem) {
      return false;
    }
    //let s = this.path + '/' + this.dir['name'] + '/' + f;
    return this.state.selectAdminItem['menuitem']['name'] === f;
  }

  addPage(f) {

    //let s = {path: this.path, menuitem: f};
    this.modalService.open(PromptComponent, {state: this.state, service: this.service, path: this.path, menuitem: f, isFolder: false});
    //this.dir['files'].push('newpage');
  }

  addFolder(f) {
    this.modalService.open(PromptComponent, {state: this.state, service: this.service, path: this.path, menuitem: f, isFolder: true});

    //    this.dir['dirs'].push({name: 'newfolder', files: [], dirs: []});
  }


}
