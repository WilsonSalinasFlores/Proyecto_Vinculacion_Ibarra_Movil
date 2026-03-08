import { Injectable, NgZone } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(
    private toastController: ToastController,
    private ngZone: NgZone
  ) {}

  async show(message: string, color: string = 'primary', duration = 4000) {
    return this.ngZone.run(async () => {
      const toast = await this.toastController.create({
        message,
        duration,
        position: 'top',
        color,
        buttons: [{ text: 'Cerrar', role: 'cancel' }],
      });
      await toast.present();
      return toast;
    });
  }

  async success(message: string) {
    await this.show(message, 'success');
  }

  async error(message: string) {
    await this.show(message, 'danger');
  }

}
