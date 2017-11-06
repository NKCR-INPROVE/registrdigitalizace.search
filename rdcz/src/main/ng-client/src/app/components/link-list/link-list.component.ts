import { Component, OnInit } from '@angular/core';
import { MzBaseModal } from 'ng2-materialize';

import {AppState} from '../../app.state'

@Component({
  selector: 'app-link-list',
  templateUrl: './link-list.component.html',
  styleUrls: ['./link-list.component.scss']
})
export class LinkListComponent extends MzBaseModal {
  
  state: AppState;
  links: string[];
  selected: string;
  fragment: string;
  
  public modalOptions: Materialize.ModalOptions = {
    dismissible: false, // Modal can be dismissed by clicking outside of the modal
    opacity: .5, // Opacity of modal background
    inDuration: 300, // Transition in duration
    outDuration: 200, // Transition out duration
    startingTop: '100%', // Starting top style attribute
    endingTop: '10%', // Ending top style attribute
    ready: (modal, trigger) => { // Callback for Modal open. Modal and trigger parameters available.
      //console.log(this);
    },
    complete: () => {
    } // Callback for Modal close
  };
  

  ngOnInit() {
  }
  
  select(l: string){
    this.selected = '/' + l;
    if(this.fragment && this.fragment !== ''){
      
    }
//    this.state.linkSelectedChanged(this.selected);
//    this.modalComponent.close();
  }
  
  ok(){
    this.state.linkSelectedChanged(this.selected, this.fragment);
    this.modalComponent.close();
  }

}
