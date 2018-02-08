import { Component, OnInit } from '@angular/core';

import { AppService } from '../../app.service';
import {AppState} from 'app/app.state';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  
  currLang: string;

  constructor(
    private service: AppService,
    public state: AppState) { }

  ngOnInit() {
    this.service.langSubject.subscribe((lang) => {
      this.currLang = lang;
    });
  }
  
  changeLang(lang: string){
    this.service.changeLang(lang);
  }

}
