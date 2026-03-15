import { Component, Optional } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  ModalController,
  LoadingController,
  AlertController,
  IonicModule,
  NavParams,
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  lockClosedOutline,
  logoGoogle,
  logoFacebook,
  arrowBackOutline,
  checkmarkCircleOutline,
  keyOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, ReactiveFormsModule],
})
export class LoginPage {
  private readonly rememberLoginKey = 'remembered_login_credentials';

  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  otpForm!: FormGroup;
  newPasswordForm!: FormGroup;

  isModal: boolean = false;
  currentView:
    | 'login'
    | 'forgot-password'
    | 'enter-otp'
    | 'new-password'
    | 'success' = 'login';
  userEmail: string = '';

  recoveryUuid: string = '';
  validatedId: any = '';
  userId: any = 0;

  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private authService: AuthService,
    @Optional() private navParams: NavParams
  ) {
    addIcons({
      mailOutline,
      lockClosedOutline,
      logoGoogle,
      logoFacebook,
      arrowBackOutline,
      checkmarkCircleOutline,
      keyOutline,
      eyeOutline,
      eyeOffOutline,
    });

    this.initializeForms();
    this.loadRememberedCredentials();
    this.setupRememberToggleWatcher();

    const navigation = this.router.getCurrentNavigation();
    this.isModal = this.navParams?.get('isModal') || false;
  }

  private initializeForms() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false],
    });

    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.otpForm = this.formBuilder.group({
      digit1: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]$/),
          Validators.min(0),
          Validators.max(9),
        ],
      ],
      digit2: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]$/),
          Validators.min(0),
          Validators.max(9),
        ],
      ],
      digit3: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]$/),
          Validators.min(0),
          Validators.max(9),
        ],
      ],
      digit4: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]$/),
          Validators.min(0),
          Validators.max(9),
        ],
      ],
      digit5: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]$/),
          Validators.min(0),
          Validators.max(9),
        ],
      ],
      digit6: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]$/),
          Validators.min(0),
          Validators.max(9),
        ],
      ],
    });

    this.newPasswordForm = this.formBuilder.group(
      {
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&].+$/
            ),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const email = this.loginForm.value.email;
      const password = this.loginForm.value.password;

      let loading: any;
      try {
        const loadingPromise = this.loadingController.create({
          message: 'Iniciando sesión...',
          spinner: 'crescent',
        });
        
        loadingPromise.then(l => {
          loading = l;
          loading.present();
        }).catch(err => {
          // Error al crear loading
        });
        
        const loginObservable = this.authService.login(email, password);
        const response = await lastValueFrom(loginObservable);

        this.persistRememberPreference();
        
        this.handleSuccessfulLogin();
      } catch (error: any) {
        let errorMessage = 'Error en el login';

        if (error.message) {
          errorMessage = error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        await this.showError(errorMessage);
      } finally {
        if (loading) {
          loading.dismiss();
        }
      }
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  private loadRememberedCredentials() {
    try {
      const raw = localStorage.getItem(this.rememberLoginKey);
      if (!raw) {
        return;
      }

      const remembered = JSON.parse(raw);
      const email = remembered?.email || '';
      const password = remembered?.password || '';

      if (email && password) {
        this.loginForm.patchValue({
          email,
          password,
          remember: true,
        });
      }
    } catch (error) {
      localStorage.removeItem(this.rememberLoginKey);
    }
  }

  private setupRememberToggleWatcher() {
    this.loginForm.get('remember')?.valueChanges.subscribe((remember) => {
      if (!remember) {
        localStorage.removeItem(this.rememberLoginKey);
      }
    });
  }

  private persistRememberPreference() {
    const remember = this.loginForm.get('remember')?.value;
    if (!remember) {
      localStorage.removeItem(this.rememberLoginKey);
      return;
    }

    const payload = {
      email: this.loginForm.get('email')?.value || '',
      password: this.loginForm.get('password')?.value || '',
    };

    localStorage.setItem(this.rememberLoginKey, JSON.stringify(payload));
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  private handleSuccessfulLogin() {
    try {
      const userData = this.authService.getCurrentUser();

      if (this.isModal) {
        this.closeModal(true, userData);
      } else {
        const pendingRoute = localStorage.getItem('pending_route');
        
        if (pendingRoute) {
          localStorage.removeItem('pending_route');
          this.router.navigate([pendingRoute]);
        } else {
          this.router.navigate(['/home']).then(() => {
            this.showWelcomeAlert(userData);
          });
        }
      }
    } catch (error) {
      this.showError('Error al procesar el inicio de sesión');
    }
  }

  private async showWelcomeAlert(userData: any) {
    const userName = userData?.name || userData?.username || 'usuario';

    const alert = await this.alertController.create({
      header: '¡Login Exitoso!',
      message: `Bienvenido/a ${userName}`,
      buttons: ['OK'],
      cssClass: 'success-alert',
    });

    alert.present();
  }

  async onForgotPasswordSubmit() {
    if (this.forgotPasswordForm.valid) {
      let loading: any;
      
      try {
        const loadingPromise = this.loadingController.create({
          message: 'Validando correo electrónico...',
          spinner: 'crescent',
        });
        
        loadingPromise.then(l => {
          loading = l;
          loading.present();
        }).catch(err => {
          // Error al crear loading
        });
        
        this.userEmail = this.forgotPasswordForm.value.email;
        
        const response = await lastValueFrom(
          this.authService.validateEmail(this.userEmail)
        );

        if (!response || !response.uuid) {
          throw new Error('No se recibió UUID del servidor');
        }

        this.recoveryUuid = response.uuid;
        this.currentView = 'enter-otp';
      } catch (error) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as any).message
            : 'Error al validar el correo electrónico';
        await this.showError(errorMessage);
      } finally {
        if (loading) {
          loading.dismiss();
        }
      }
    }
  }

  async onOTPSubmit() {
    if (this.otpForm.valid) {
      let loading: any;

      const loadingPromise = this.loadingController.create({
        message: 'Validando código...',
        spinner: 'crescent',
      });
      
      loadingPromise.then(l => {
        loading = l;
        loading.present();
      }).catch(err => {
        // Error al crear loading
      });

      const otpCode = Object.values(this.otpForm.value)
        .map(val => String(val).trim())
        .join('');

      if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
        if (loading) loading.dismiss();
        await this.showError('Por favor ingresa un código válido de 6 dígitos');
        return;
      }

      if (!this.recoveryUuid || this.recoveryUuid.trim() === '') {
        if (loading) loading.dismiss();
        await this.showError('Error: No se encontró la sesión de recuperación. Por favor intenta de nuevo.');
        this.currentView = 'forgot-password';
        return;
      }

      try {
        const response = await lastValueFrom(
          this.authService.validateOTP(otpCode, this.recoveryUuid)
        );

        if (!response) {
          throw new Error('No se recibió respuesta del servidor');
        }
        
        let foundUserId = null;
        const possibleKeys = [
          'idUsuario',
          'validatedId',
          'userId',
          'id',
          'user_id',
          'userID',
          'ID',
        ];

        for (const key of possibleKeys) {
          if (response[key] !== undefined && response[key] !== null) {
            foundUserId = response[key];
            break;
          }
        }

        if (foundUserId !== null) {
          this.validatedId = foundUserId;
          this.currentView = 'new-password';
        } else {
          this.validatedId = this.recoveryUuid;
          this.currentView = 'new-password';
        }
        
      } catch (error) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as any).message
            : 'Código inválido o expirado';
        await this.showError(errorMessage);

        this.otpForm.reset();
      } finally {
        if (loading) {
          loading.dismiss();
        }
      }
    }
  }

  async onNewPasswordSubmit() {
    if (this.newPasswordForm.valid) {
        let loading: any;

        try {
          const loadingPromise = this.loadingController.create({
            message: 'Actualizando contraseña...',
            spinner: 'crescent',
          });
        
          loadingPromise.then(l => {
            loading = l;
            loading.present();
          }).catch(err => {
            // Error al crear loading
          });

        if (
          !this.validatedId ||
          this.validatedId === 'undefined' ||
          this.validatedId === 'null'
        ) {
          throw new Error('No se pudo obtener el ID de usuario válido');
        }

        this.userId = this.validatedId;

        const userIdNumber = parseInt(this.userId);
        if (isNaN(userIdNumber)) {
          throw new Error(
            'ID de usuario inválido. Intente nuevamente desde el inicio.'
          );
        }

        await lastValueFrom(
          this.authService.resetPassword(
            userIdNumber,
            this.newPasswordForm.value.newPassword
          )
        );

        this.currentView = 'success';
      } catch (error) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as any).message
            : 'Error al actualizar la contraseña. Verifique su conexión e intente nuevamente.';
        await this.showError(errorMessage);
      } finally {
          if (loading) {
            loading.dismiss();
          }
      }
    } else {
      this.markFormGroupTouched(this.newPasswordForm);
    }
  }

  onOTPInput(event: any, currentInput: number) {
    const value = event.target.value;

    if (!/^[0-9]$/.test(value)) {
      event.target.value = '';
      return;
    }

    if (value && currentInput < 6) {
      const nextInput = document.querySelector(
        `ion-input[data-otp="${currentInput + 1}"]`
      ) as HTMLIonInputElement;
      if (nextInput) {
        nextInput.setFocus();
      }
    }
  }

  onOTPKeydown(event: any, currentInput: number) {
    if (
      event.key === '-' ||
      event.key === '+' ||
      event.key === 'e' ||
      event.key === 'E'
    ) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Backspace' && !event.target.value && currentInput > 1) {
      const prevInput = document.querySelector(
        `ion-input[data-otp="${currentInput - 1}"]`
      ) as HTMLIonInputElement;
      if (prevInput) {
        prevInput.setFocus();
      }
    }
  }

  forgotPassword() {
    this.currentView = 'forgot-password';
    
    if (this.loginForm.value.email) {
      this.forgotPasswordForm.patchValue({ email: this.loginForm.value.email });
    }
  }

  backToLogin() {
    this.currentView = 'login';
    this.resetRecoveryData();
  }

  backToForgotPassword() {
    this.currentView = 'forgot-password';
    this.otpForm.reset();
  }

  backToOTP() {
    this.currentView = 'enter-otp';
    this.newPasswordForm.reset();
  }

  resendOTP() {
    this.onForgotPasswordSubmit();
  }

  private resetRecoveryData() {
    this.forgotPasswordForm.reset();
    this.otpForm.reset();
    this.newPasswordForm.reset();
    this.userEmail = '';
    this.recoveryUuid = '';
    this.validatedId = '';
    this.userId = 0;
  }

  private async showLoading(message: string) {
    const loading = await this.loadingController.create({
      message: message,
      spinner: 'crescent',
    });
    await loading.present();
    return loading;
  }

  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['Aceptar'],
      cssClass: 'error-alert'
    });
    await alert.present();
  }

  async closeModal(authenticated: boolean, userData?: any) {
    await this.modalCtrl.dismiss({
      authenticated,
      userData,
    });
  }

  goToRegister() {
    if (this.isModal) {
      // Cerrar el modal indicando que quiere ir al registro
      this.modalCtrl.dismiss({
        authenticated: false,
        navigateToRegister: true,
      });
    } else {
      this.router.navigate(['/registro-app']);
    }
  }

  loginSuccess() {
    this.closeModal(true);
  }

  cancelLogin() {
    this.modalCtrl.dismiss({
      authenticated: false,
    });
  }

  togglePasswordVisibility(field: 'new' | 'confirm') {
    if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }
}
