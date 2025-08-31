import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriveLectureComponent } from './drive-lecture.component';

describe('DriveLectureComponent', () => {
  let component: DriveLectureComponent;
  let fixture: ComponentFixture<DriveLectureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriveLectureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DriveLectureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
