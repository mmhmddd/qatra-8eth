import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinMassegeComponent } from './join-massege.component';

describe('JoinMassegeComponent', () => {
  let component: JoinMassegeComponent;
  let fixture: ComponentFixture<JoinMassegeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinMassegeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JoinMassegeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
