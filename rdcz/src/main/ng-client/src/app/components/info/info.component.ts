import { Component, OnInit, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { AppState } from '../../app.state';
import { AppService } from '../../app.service';
import {InnerContentComponent} from '../inner-content/inner-content.component';
import {NgProgress} from 'ngx-progressbar';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {
  @ViewChild(InnerContentComponent) inn: InnerContentComponent;
  
  loading: boolean = true;
  menu: any = null;
  subscriptions: Subscription[] = [];
  page: string = '';

  constructor(
    public ngProgress: NgProgress,
    private componentFactoryResolver: ComponentFactoryResolver,
    public state: AppState,
    public service: AppService,
    private router: Router,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.fillMenu();
    let param = '/' + this.route.snapshot.url.join("/");
    this.loadComponent(param);
    this.subscriptions.push(this.service.langSubject.subscribe(
      () => {
        this.loadComponent('/' + this.route.snapshot.url.join("/"));
      }
    ));
    
    this.subscriptions.push(this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
            this.loadComponent('/' + this.route.snapshot.url.join("/"));
         }
    }));
  }
  

  select(f: string) {
    this.router.navigate([f]);
//    this.loadComponent(f);
//    this.page = 'pages/' + f;
  }
  
  isMain(){
    if(!this.menu){
      return true;
    }
    return this.route.snapshot.paramMap.get('page') === null;
  }

  isActive(f: string) {
    return this.page === 'pages/' + f;
  }

  fillMenu() {
      this.service.getEditablePages().subscribe(res => {
        //this.menu = res;
        this.menu = {
          "name": "pages",
          "pages": [
            {"name":"help", "en":"Help","cs":"Nápověda"},
            {"name":"info", "en":"Info","cs":"Info", "pages": [
                  {"name":"ccnb", "en":"How to obtain ČČNB","cs":"Jak získat ČČNB pro české novodobé dokumenty"},
                  {"name":"data", "en":"Jak posílat data","cs":"Jak posílat data", "pages":[
                        {"name":"excel", "en":"Table","cs":"Tabuka"},
                        {"name":"marcxml", "en":"MARCXML","cs":"MARCXML"},
                        {"name":"exportSKC", "en":"SKC service","cs":"služba SKC"}
                      ]
                    },
                  {"name":"nueva", "en":"new","cs":"nova"},
                  {"name":"prehled_instituci-zaloha", "en":"prehled_instituci-zaloha","cs":"prehled_instituci-zaloha"},
                  {"name":"prehled_instituci", "en":"Přehled zapojených institucí ","cs":"Přehled zapojených institucí "},
                  {"name":"relief", "en":"relief","cs":"relief"},
                  {"name":"statistika_titulu", "en":"Statistika počtu titulů","cs":"Statistika počtu titulů"},
                  {"name":"statistika_titulu2014", "en":"statistika_titulu2014","cs":"statistika_titulu2014"},
                  {"name":"dotaznik2013", "en":"Výsledky dotazníku 2013","cs":"Výsledky dotazníku 2013"},
                ]
              }

          ]
        };
        
        this.menu = res;
    
    });
    
  }
  
  loadComponent(param) {
    let newPage = '';
    if(!param || param === ''){
      newPage = 'pages';
    } else {
      newPage = 'pages' + param;
    }
    
    if(newPage.split("#")[0] === this.page.split("#")[0]){
      // The same page, skipping
      return;
    }
    this.page = newPage.toString();
    this.ngProgress.start();
    this.loading = true;
    //this.inn.setText('');
    
    this.service.getText(this.page).subscribe(t => {
//      let componentFactory = this.componentFactoryResolver.resolveComponentFactory(InnerContentComponent);
//      let viewContainerRef = this.inner.viewContainerRef;
//      viewContainerRef.clear();
//      let componentRef = viewContainerRef.createComponent(componentFactory);
//      (<InnerContentComponent>componentRef.instance).setText(t);
      this.inn.setText(t);
      this.loading = false;
      this.ngProgress.done();
    });
  }

  ngOnDestroy() {
    console.log('destroy');
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }

}
