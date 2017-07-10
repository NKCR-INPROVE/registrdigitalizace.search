import { Component, OnInit, ViewChild, ElementRef, Renderer } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { AppService } from '../../app.service';
import { AppState } from '../../app.state';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit {

  @ViewChild('advNazev') advNazev: any;
  @ViewChild('searchForm') searchForm: any;

//  public searchForm: FormGroup;


  constructor(private service: AppService,
    private router: Router,
    public state: AppState, 
    elementRef: ElementRef, private renderer: Renderer) {
  }

  ngOnInit() {
    //    this.searchForm = this.formBuilder.group({});
    this.renderer.listenGlobal('document', 'click', (event) => {
      if (!this.state.isAdvancedCollapsed && !this.searchForm.nativeElement.contains(event.target)) {
         this.closeAdv();
      }
    })
  }

  search() {
    this.state.isAdvancedCollapsed = true;
    this.service.goToResults();
  }

  // pedro
  openAdvanced() {
    setTimeout(() => {
      this.state.isAdvancedCollapsed = !this.state.isAdvancedCollapsed;
      if (!this.state.isAdvancedCollapsed) {
        this.advNazev.nativeElement.focus();
      }
    }, 10);
  }

  closeAdv() {
    this.state.isAdvancedCollapsed = true;
  }

  cleanQ() {
    this.state.q = '';
    this.service.goToResults();
  }

  duplicity() {
    if (this.state.q === '') {
      this.router.navigate(['/duplicity']);
    } else {
      this.service.searchAleph().subscribe(res => {
        console.log(res['find']['no_records']);
        if (res['find'] && res['find']['no_records']) {
          let no_records: number = +res['find']['no_records'];
          if (no_records > 0) {
            this.service.getFromAleph(res['find']['set_number'], res['find']['no_records']).subscribe(res2 => {
              console.log(res2);
              let varFields = res2['present']['record']['metadata']['oai_marc']['varfield'];
              for (let i in varFields) {
                if (varFields[i]['@id'] === '245') {
                  let sub = varFields[i]['subfield'];
                  this.state.q = sub[0]['#text'];
                  this.service.goToResults();
                  //return;
                }
              }
              //[@id='245']/subfield[@label='a']
            });
          } else {
            console.log('zadne vysledek');
            this.router.navigate(['/duplicity']);
          }
        } else {

          this.router.navigate(['/duplicity']);
        }
      });
    }
  }

}
