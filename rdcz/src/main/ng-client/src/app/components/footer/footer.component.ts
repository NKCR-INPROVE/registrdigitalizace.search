import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  
  isFooterTextCollapsed: boolean = true; // pedro

  constructor() { }

  ngOnInit() {
  }

  // pedro
  openFooterText() {
    setTimeout(() => {
      this.isFooterTextCollapsed = !this.isFooterTextCollapsed;
    }, 100);
  }
}
