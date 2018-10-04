import {Component} from '@angular/core';
import {MzBaseModal} from 'ng2-materialize';

import {AppState} from 'app/app.state';
import {AppService} from 'app/app.service';

@Component({
  selector: 'app-aleph-dialog',
  templateUrl: './aleph-dialog.component.html',
  styleUrls: ['./aleph-dialog.component.scss']
})
export class AlephDialogComponent extends MzBaseModal {

  state: AppState;
  service: AppService;
  records: any[] = [];

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

  getTitle(record: any): string {
    return this.service.getTitleFromMarc(record);
  }
  
  ok(record: any){
    let title: string = this.getTitle(record);
    this.state.q = this.service.removeAlephChars(title);
    this.modalComponent.close();
    this.service.goToResults();
  }

}
