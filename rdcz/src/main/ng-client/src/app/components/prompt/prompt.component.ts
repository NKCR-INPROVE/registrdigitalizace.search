import { Component, OnInit } from '@angular/core';
import { MzBaseModal, MzModalComponent } from 'ng2-materialize';

@Component({
  selector: 'app-prompt',
  templateUrl: './prompt.component.html',
  styleUrls: ['./prompt.component.scss']
})
export class PromptComponent extends MzBaseModal {
  val: string;
  dir: any;
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
    if(this.isFolder){
      this.dir['dirs'].push({name: this.val, files: [], dirs: []});
    } else {
      this.dir['files'].push(this.val);
    }
    this.modalComponent.close();
  }

}
