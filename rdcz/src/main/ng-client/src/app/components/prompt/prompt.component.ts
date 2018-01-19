import { Component, OnInit } from '@angular/core';
import { MzBaseModal, MzModalComponent } from 'ng2-materialize';
import {AppState} from 'app/app.state';
import {AppService} from 'app/app.service';

@Component({
  selector: 'app-prompt',
  templateUrl: './prompt.component.html',
  styleUrls: ['./prompt.component.scss']
})
export class PromptComponent extends MzBaseModal {
  
  state: AppState;
  service: AppService;
  
  val: string;
  path: string;
  menuitem: any;
  isFolder: boolean = false;

  public modalOptions: Materialize.ModalOptions = {
    dismissible: false, // Modal can be dismissed by clicking outside of the modal
    opacity: .5, // Opacity of modal background
    inDuration: 300, // Transition in duration
    outDuration: 200, // Transition out duration
    startingTop: '100%', // Starting top style attribute
    endingTop: '10%', // Ending top style attribute
    ready: (modal, trigger) => { // Callback for Modal open. Modal and trigger parameters available.
      console.log(this);
    },
    complete: () => {
    } // Callback for Modal close
  };
  
  ngOnInit() {
  }
  
  ok(){
    if(this.menuitem.hasOwnProperty('pages')){
      this.menuitem['pages'].push({name: this.val, cs: this.val, en: this.val});
    } else {
      this.menuitem['pages'] = [{name: this.val, cs: this.val, en: this.val}];
    }
    this.service.saveMenu(null).subscribe(res => {
      console.log(res);
      
    });
    this.modalComponent.close();
  }

}
