import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { NgbModule, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { FifteenComponent } from './fifteen.component';
import { WindowRef } from './windowref.service';

@NgModule({
  declarations: [
    FifteenComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NgbModule.forRoot()
  ],
  providers: [WindowRef],
  bootstrap: [FifteenComponent]
})
export class FifteenModule { }
