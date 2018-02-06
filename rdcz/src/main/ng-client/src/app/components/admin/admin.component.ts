import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import {MzModalService} from 'ng2-materialize';
import {LinkListComponent} from '../link-list/link-list.component';

import { AppService } from '../../app.service';
import { AppState } from '../../app.state';

declare var tinymce: any;


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {

  subscriptions: Subscription[] = [];

  selected: any = {path: '/pages', menuitem: {"name":"help", "en":"Help","cs":"Nápověda"}};
  visibleChanged: boolean = false;
  saved: boolean = false;

  text: string;
  elementId: string = 'editEl';

  editor;

  ngOnInit() {
  }
  

  showLinkList() {
    //console.log(this.editor.selection.getNode());
    let selected = "";
    let node: Element = this.editor.selection.getNode();
    if(node.hasAttribute('routerlink')){
      selected = node.getAttribute('routerlink');
    }
    
    let fragment = "";
    if(node.hasAttribute('fragment')){
      fragment = node.getAttribute('fragment');
    }
    
    let links = [];
      
    //From router
    links.push('home');  
    links.push('results');  
    links.push('prihlaseni');  
    links.push('home');  
    
    this.addLinks(links, this.state.info_menu['pages'], '');
    
    this.modalService.open(LinkListComponent, {state: this.state, links: links, selected: selected, fragment: fragment});
  }
  
  addLinks(links: string[], pages: any[], path: string){
    console.log(pages);
    for(let i in pages){
      links.push(path + pages[i]['name']);
      if(pages[i].hasOwnProperty('pages')){
        this.addLinks(links, pages[i]['pages'], path + pages[i]['name'] + '/');
      }
    }
  }
  
  selectLink(l: {link: string, fragment: string}){
    let node: Element = this.editor.selection.getNode();
    if(node.hasAttribute('routerlink')){
      node.setAttribute('routerlink', l.link);
      if(l.fragment && l.fragment !== ''){
        node.setAttribute('fragment', l.fragment);
      } else {
        node.removeAttribute('fragment');
      }
    } else if(node.hasAttribute('href')){
      node.setAttribute('routerlink', l.link);
      if(l.fragment && l.fragment !== ''){
        node.setAttribute('fragment', l.fragment);
      } else {
        node.removeAttribute('fragment');
      }
      node.removeAttribute('href');
    } else if(this.editor.selection.getContent().length == 0){
      let ret = ' <a routerLink="' + l.link + '"';
      if(l.fragment && l.fragment !== ''){
        ret += ' fragment="' + l.fragment;
      }
      ret += '>'+ l.link+'</a> ';
      this.editor.insertContent(ret);
    } else {
      let ret = ' <a routerLink="' + l.link + '"';
      if(l.fragment && l.fragment !== ''){
        ret += ' fragment="' + l.fragment;
      }
      ret += '>'+ this.editor.selection.getContent() +'</a> ';
      this.editor.insertContent(ret);
    }
  }

  constructor(
    private modalService: MzModalService,
    public state: AppState,
    private service: AppService) { }

  ngAfterViewInit() {
    var ctx = this.state.config ? this.state.config['context'] : '/';
    var that = this;
    tinymce.init({
      selector: '#' + this.elementId,
      menubar: false,
      plugins: ['link', 'paste', 'table', 'save', 'code', 'image', 'anchor', 'lists'],
      //toolbar: 'save | undo redo | insert | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | link image | code anchor nglink',
      toolbar: 'save | undo redo | insert | styleselect | bold italic | table | link image | code anchor nglink',
      theme: "modern",
      content_css: ctx + 'assets/editor.css',
      body_class: 'underlined',
      skin_url: ctx + 'assets/skins/light',
      //images_upload_url: 'img?action=UPLOAD&id=' + this.selected,
      
      images_upload_handler: function (blobInfo, success, failure) {
        var xhr: XMLHttpRequest;
        var formData;
        xhr = new XMLHttpRequest();
        xhr.withCredentials = false;
        xhr.open('POST', 'img?action=UPLOAD&id=' + that.selected);
        xhr.onload = function() {
          var json;

          if (xhr.status != 200) {
            failure('HTTP Error: ' + xhr.status);
            return;
          }
          json = JSON.parse(xhr.responseText);

          if (!json || typeof json.location != 'string') {
            failure('Invalid JSON: ' + xhr.responseText);
            return;
          }
          success(json.location);
        };
        formData = new FormData();
        //formData.append('file', blobInfo.blob(), fileName(blobInfo));
        console.log(blobInfo.filename(), blobInfo.name());
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        xhr.send(formData);
      },

      file_picker_callback: function(cb, value, meta) {
        var input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('name', 'file');
        input.setAttribute('accept', 'image/*');

        input.onchange = function() {
          var file = this['files'][0];

          var reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = function() {
            var id = 'blobid' + (new Date()).getTime();
            var blobCache = tinymce.activeEditor.editorUpload.blobCache;
            var base64 = reader.result.split(',')[1];
            var blobInfo = blobCache.create(id, file, base64);
            blobCache.add(blobInfo);

            // call the callback and populate the Title field with the file name
            cb(blobInfo.blobUri(), { title: file.name });
          };
        };

        input.click();
      },
      //valid_elements: 'a[routerLink|*]',


      file_browser_callback_types: 'file image media',
      setup: editor => {
        editor.addButton('nglink', {
          text: 'Internal link',
          icon: false,
          onclick: () => {
            this.showLinkList();
          }
        });
        //editor.schema.addValidElements('a[attr=routerLink');
        this.editor = editor;
        this.initData();
      },
      save_oncancelcallback: function() { console.log('Save canceled'); },
      save_onsavecallback: () => this.save()
    });
  }

  initData() {

    if (this.state.config) {
      this.fillMenu();
    } else {
      this.subscriptions.push(this.state.configSubject.subscribe(val => {
        this.fillMenu();
      }));
    }

    this.subscriptions.push(this.service.langSubject.subscribe(val => {
      this.getText();
    }));

    this.subscriptions.push(this.state.adminChanged.subscribe(val => {
      this.select();
    }));

    this.subscriptions.push(this.state.linkSelected.subscribe(val => {
      this.selectLink(val);
    }));
  }


  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
    tinymce.remove(this.editor);
  }

  fillMenu() {
    this.service.getEditablePages().subscribe(res => {
      //this.state.info_menu = res;
      this.state.info_menu = {
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
        
      this.state.info_menu = res;

      let s = '/pages/' + this.state.info_menu['pages'][0]; 
      //this.state.setSelectAdminItem(s);
    });
    
  }

  getText() {
    let path = this.selected['path'] + '/' + this.selected['menuitem']['name'];
    this.service.getText(path).subscribe(t => {
      this.text = t;
      this.editor.schema.addValidElements('a[routerLink|*]');
      this.editor.schema.addValidElements('a[fragment|*]');
      this.editor['settings']['images_upload_url'] = 'img?action=UPLOAD&name=' + this.selected['menuitem']['name'];
      this.editor.setContent(this.text);
      
      //console.log(this.editor.settings);
      //images_upload_url: 'img?action=UPLOAD&name=' + this.selected,
    });
  }

  select() {
    this.selected = this.state.selectAdminItem;
    this.saved = false;
    this.getText();
  }

  save() {

    const content = this.editor.getContent();
    
    this.service.saveText(this.selected['path'] + '/' + this.selected['menuitem']['name'], content).subscribe(res => {
      console.log(res);
      this.saved = !res.hasOwnProperty('error');
    });
    
    this.service.saveMenu(this.selected).subscribe(res => {
      console.log(res);
      this.saved = !res.hasOwnProperty('error');
    });
  }

  changeVisible() {
    this.visibleChanged = true;
    //console.log(this.state.info_menu);
  }

}
