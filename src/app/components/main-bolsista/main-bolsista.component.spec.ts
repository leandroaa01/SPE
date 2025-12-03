import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainBolsistaComponent } from './main-bolsista.component';

describe('MainBolsistaComponent', () => {
  let component: MainBolsistaComponent;
  let fixture: ComponentFixture<MainBolsistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainBolsistaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MainBolsistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
