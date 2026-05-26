import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppointmentService, GenerateDescriptionRequest } from '../services/appointment.service';
import { PREDEFINED_APPOINTMENT_TYPES, PredefinedAppointmentType } from '../models/predefined-appointment.model';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css']
})
export class AppointmentFormComponent implements OnInit {
  appointmentForm: FormGroup;
  isEditMode = signal(false);
  appointmentId = signal<number | null>(null);
  submitting = signal(false);
  aiGenerating = signal(false);
  aiError = signal<string | null>(null);
  usePredefined = signal(false);
  predefinedTypes = PREDEFINED_APPOINTMENT_TYPES;
  selectedPredefinedType = signal<PredefinedAppointmentType | null>(null);

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.appointmentForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      appointmentDate: ['', [Validators.required]],
      appointmentTime: ['', [Validators.required]],
      predefinedType: [''],
      dateOfChange: [''],
      futureChangeDate: [''],
      futureChangeTime: ['']
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const appointmentId = parseInt(id);
      this.isEditMode.set(true);
      this.appointmentId.set(appointmentId);
      this.loadAppointment(appointmentId);
    }
  }

  loadAppointment(id: number) {
    this.appointmentService.getAppointment(id).subscribe({
      next: (appointment: any) => {
        const date = new Date(appointment.appointmentDate);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        
        // Format date as YYYY-MM-DD
        const dateStr = localDate.toISOString().slice(0, 10);
        // Format time as HH:MM
        const timeStr = localDate.toTimeString().slice(0, 5);
        
        this.appointmentForm.patchValue({
          title: appointment.title,
          description: appointment.description || '',
          appointmentDate: dateStr,
          appointmentTime: timeStr
        });
      },
      error: (error: any) => {
        console.error('Error loading appointment:', error);
        alert('Failed to load appointment. Please try again.');
        this.router.navigate(['/']);
      }
    });
  }

  onSubmit() {
    if (this.appointmentForm.valid) {
      this.submitting.set(true);
      const formValue = this.appointmentForm.value;
      
      let appointmentDate: string;
      let title: string;
      let description: string;

      if (this.usePredefined()) {
        // For predefined appointments, use future change date/time
        const dateTimeString = `${formValue.futureChangeDate}T${formValue.futureChangeTime}`;
        appointmentDate = new Date(dateTimeString).toISOString();
        
        title = formValue.title;
        // Store date of change in description along with original description
        const dateOfChange = formValue.dateOfChange;
        const originalDesc = formValue.description || '';
        description = originalDesc 
          ? `${originalDesc}\n\nDate of Change: ${new Date(dateOfChange).toLocaleDateString()}`
          : `Date of Change: ${new Date(dateOfChange).toLocaleDateString()}`;
      } else {
        // For custom appointments, use regular date/time
        const dateTimeString = `${formValue.appointmentDate}T${formValue.appointmentTime}`;
        appointmentDate = new Date(dateTimeString).toISOString();
        
        title = formValue.title;
        description = formValue.description || undefined;
      }
      
      const appointmentData = {
        title: title,
        description: description,
        appointmentDate: appointmentDate
      };

      if (this.isEditMode() && this.appointmentId()) {
        this.appointmentService.updateAppointment(this.appointmentId()!, appointmentData).subscribe({
          next: () => {
            this.submitting.set(false);
            this.router.navigate(['/']);
          },
          error: (error: any) => {
            console.error('Error updating appointment:', error);
            this.submitting.set(false);
            alert('Failed to update appointment. Please try again.');
          }
        });
      } else {
        this.appointmentService.createAppointment(appointmentData).subscribe({
          next: () => {
            this.submitting.set(false);
            this.router.navigate(['/']);
          },
          error: (error: any) => {
            console.error('Error creating appointment:', error);
            this.submitting.set(false);
            alert('Failed to create appointment. Please try again.');
          }
        });
      }
    }
  }

  generateDescription() {
    this.aiError.set(null);

    const formValue = this.appointmentForm.value;
    const title = (formValue.title || '').trim();
    if (!title) {
      this.aiError.set('Please provide a title first.');
      return;
    }

    const payload: GenerateDescriptionRequest = {
      title,
      description: formValue.description ? formValue.description : undefined,
      mode: this.usePredefined() ? 'predefined' : 'custom',
      appointmentDate: !this.usePredefined() ? formValue.appointmentDate : undefined,
      appointmentTime: !this.usePredefined() ? formValue.appointmentTime : undefined,
      predefinedTypeName: this.usePredefined() ? this.selectedPredefinedType()?.name : undefined,
      dateOfChange: this.usePredefined() ? formValue.dateOfChange : undefined,
      futureChangeDate: this.usePredefined() ? formValue.futureChangeDate : undefined,
      futureChangeTime: this.usePredefined() ? formValue.futureChangeTime : undefined,
    };

    this.aiGenerating.set(true);
    this.appointmentService.generateDescription(payload).subscribe({
      next: (result) => {
        this.aiGenerating.set(false);
        if (result.title) {
          this.appointmentForm.patchValue({ title: result.title });
        }
        this.appointmentForm.patchValue({ description: result.description });
      },
      error: (error: any) => {
        console.error('Error generating description:', error);
        this.aiGenerating.set(false);
        this.aiError.set(error?.error?.error || 'AI generation failed. Please try again.');
      },
    });
  }

  togglePredefined() {
    this.usePredefined.set(!this.usePredefined());
    
    if (this.usePredefined()) {
      // Switch to predefined mode - require predefined fields
      this.appointmentForm.get('predefinedType')?.setValidators([Validators.required]);
      this.appointmentForm.get('dateOfChange')?.setValidators([Validators.required]);
      this.appointmentForm.get('futureChangeDate')?.setValidators([Validators.required]);
      this.appointmentForm.get('futureChangeTime')?.setValidators([Validators.required]);
      
      // Clear custom appointment validators
      this.appointmentForm.get('appointmentDate')?.clearValidators();
      this.appointmentForm.get('appointmentTime')?.clearValidators();
    } else {
      // Switch to custom mode - require custom fields
      this.appointmentForm.get('appointmentDate')?.setValidators([Validators.required]);
      this.appointmentForm.get('appointmentTime')?.setValidators([Validators.required]);
      
      // Clear predefined validators
      this.appointmentForm.get('predefinedType')?.clearValidators();
      this.appointmentForm.get('dateOfChange')?.clearValidators();
      this.appointmentForm.get('futureChangeDate')?.clearValidators();
      this.appointmentForm.get('futureChangeTime')?.clearValidators();
      
      this.selectedPredefinedType.set(null);
      this.appointmentForm.patchValue({
        predefinedType: '',
        dateOfChange: '',
        futureChangeDate: '',
        futureChangeTime: ''
      });
    }
    
    // Update validity
    this.appointmentForm.get('predefinedType')?.updateValueAndValidity();
    this.appointmentForm.get('dateOfChange')?.updateValueAndValidity();
    this.appointmentForm.get('futureChangeDate')?.updateValueAndValidity();
    this.appointmentForm.get('futureChangeTime')?.updateValueAndValidity();
    this.appointmentForm.get('appointmentDate')?.updateValueAndValidity();
    this.appointmentForm.get('appointmentTime')?.updateValueAndValidity();
  }

  onPredefinedTypeChange(typeId: string) {
    const type = this.predefinedTypes.find(t => t.id === typeId);
    if (type) {
      this.selectedPredefinedType.set(type);
      this.appointmentForm.patchValue({
        title: type.name,
        description: type.description
      });
    }
  }

  cancel() {
    this.router.navigate(['/']);
  }
}

