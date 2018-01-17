import { Component, AfterViewInit, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { AppState } from '../../app.state';
import { AppService } from '../../app.service';
import {InnerContentComponent} from '../inner-content/inner-content.component';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements AfterViewInit {
  
  @ViewChild(InnerContentComponent) inn: InnerContentComponent;
  
  
  menu: any = null;
  subscriptions: Subscription[] = [];
  page: string = 'pages/info';

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    public state: AppState,
    public service: AppService,
    private router: Router,
    private route: ActivatedRoute) { }

  ngAfterViewInit() {
    this.fillMenu();
    let param = this.route.snapshot.paramMap.get('page');
    this.loadComponent(param);
    this.subscriptions.push(this.service.langSubject.subscribe(
      () => {
        this.loadComponent(param);
      }
    ));
  }
  

  select(f: string) {
    this.router.navigate(['/info/' + f]);
    this.loadComponent(f);
//    this.page = 'pages/' + f;
  }

  isActive(f: string) {
    return this.page === 'pages/' + f;
  }

  fillMenu() {
      this.service.getEditablePages().subscribe(res => {
        //this.menu = res;
        this.menu = {
          "name": "pages",
          "dirs": [{
            "name": "info",
            "dirs": [],
            "files": [
              "exportSKC",
              "index",
              "ccnb",
              "dotaznik2013",
              "relief",
              "statistika",
              "vysvetlivky",
              "napoveda",
              "newpage",
              "prehled",
              "excel",
              "marcxml"
            ]
          }],
          "files": [
            "info",
            "help"
          ]
        };
        
        this.menu = res;
    
      });
    
  }
  
  loadComponent(param) {
    
    if(!param || param === ''){
      this.page = 'pages/info';
    } else {
      this.page = 'pages/info/' + param;
    }
    
    this.service.getText(this.page).subscribe(t => {
//      let componentFactory = this.componentFactoryResolver.resolveComponentFactory(InnerContentComponent);
//      let viewContainerRef = this.inner.viewContainerRef;
//      viewContainerRef.clear();
//      let componentRef = viewContainerRef.createComponent(componentFactory);
//      (<InnerContentComponent>componentRef.instance).setText(t);
      this.inn.setText(t);
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }

}
