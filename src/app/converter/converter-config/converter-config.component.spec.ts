import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConverterConfigComponent } from './converter-config.component';

describe('ConverterConfigComponent', () => {
  let component: ConverterConfigComponent;
  let fixture: ComponentFixture<ConverterConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConverterConfigComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConverterConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
