import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { PerfilService, UpdateUserDto } from '../services/perfil.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule]
})
export class PerfilPage implements OnInit {
  profileForm!: FormGroup;
  isEditing = false;
  originalData: any = {};

  constructor(
    private fb: FormBuilder,
    private perfilService: PerfilService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadProfile();
  }

  private initForm() {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phone: [{ value: '', disabled: true }],
      address: [{ value: '', disabled: true }],
      username: [{ value: '', disabled: true }, Validators.required],
      name: [{ value: '', disabled: true }],
      lastname: [{ value: '', disabled: true }],
      business: [{ value: '', disabled: true }]
    });
  }

  private loadProfile() {
    this.perfilService.getProfile().subscribe({
      next: (data) => {
        this.originalData = { ...data };
        this.profileForm.patchValue(data);
        localStorage.setItem('user_data', JSON.stringify(data));
      },
      error: (error) => {
        console.error('Error cargando perfil:', error);
        this.loadFromLocalStorage();
        this.showErrorAlert('Error', 'No se pudo cargar el perfil desde el servidor');
      }
    });
  }

  private loadFromLocalStorage() {
    const stored = localStorage.getItem('user_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.originalData = { ...data };
        this.profileForm.patchValue(data);
      } catch (e) {
        console.error('Error parsing localStorage data:', e);
      }
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    
    if (this.isEditing) {
      // Habilitar campos editables
      this.profileForm.get('email')?.enable();
      this.profileForm.get('phone')?.enable();
      this.profileForm.get('address')?.enable();
      this.profileForm.get('username')?.disable();
      
      // Log temporal para diagnóstico
      console.log('Modo edición activado');
      console.log('Form valid:', this.profileForm.valid);
      console.log('Form status:', this.profileForm.status);
      console.log('Email errors:', this.profileForm.get('email')?.errors);
    } else {
      // Cancelar edición - restaurar valores originales
      this.profileForm.patchValue(this.originalData);
      // Deshabilitar campos
      this.profileForm.get('email')?.disable();
      this.profileForm.get('phone')?.disable();
      this.profileForm.get('address')?.disable();
      this.profileForm.get('username')?.disable();
    }
  }

  async saveProfile() {
    console.log('=== GUARDANDO PERFIL ===');
    console.log('Form valid:', this.profileForm.valid);
    
    if (this.profileForm.invalid) {
      this.markFormGroupTouched();
      const alert = await this.alertCtrl.create({
        header: 'Datos inválidos',
        message: 'Por favor, completa todos los campos requeridos correctamente',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    console.log('Después de validación');

    // Usar getRawValue() para obtener todos los valores incluyendo disabled
    const formValue = this.profileForm.getRawValue();
    console.log('Form value obtenido:', formValue);
    
    const updateData: UpdateUserDto = {
      email: formValue.email,
      phone: formValue.phone || '',
      address: formValue.address || '',
      username: formValue.username
    };
    
    console.log('Datos a enviar:', updateData);
    console.log('Llamando al servicio...');

    this.perfilService.updateProfile(updateData).subscribe({
      next: async () => {
        console.log('Respuesta exitosa del servidor');
        
        // Actualizar datos originales
        this.originalData = { ...this.originalData, ...updateData };
        localStorage.setItem('user_data', JSON.stringify(this.originalData));
        
        this.isEditing = false;
        // Deshabilitar campos después de guardar
        this.profileForm.get('email')?.disable();
        this.profileForm.get('phone')?.disable();
        this.profileForm.get('address')?.disable();
        this.profileForm.get('username')?.disable();
        
        await this.showSuccessAlert('Perfil actualizado correctamente');
      },
      error: async (error) => {
        console.error('=== ERROR AL ACTUALIZAR ===');
        console.error('Error completo:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        
        let errorMessage = 'Error al guardar los cambios';
        if (error.status === 400) errorMessage = 'Datos inválidos';
        if (error.status === 409) errorMessage = 'El email o usuario ya existe';
        if (error.status === 401) errorMessage = 'Sesión expirada';
        
        await this.showErrorAlert('Error', errorMessage);
      }
    });
    
    console.log('Subscribe configurado');
  }

  private markFormGroupTouched() {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      if (control && control.enabled) {
        control.markAsTouched();
      }
    });
  }

  private async showSuccessAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Éxito',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showErrorAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  // Helper para debugging
  logFormState(): void {}

  goBack() {
    this.router.navigate(['/home']);
  }
}