import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, ModalController, IonImg, IonChip } from '@ionic/angular/standalone';
import { Evento } from '../evento.model';

@Component({
  selector: 'app-evento',
  templateUrl: './evento.page.html',
  styleUrls: ['./evento.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonImg, IonChip, CommonModule, FormsModule]
})
export class EventoPage implements OnInit {
  @Input() evento?: Evento;

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  abrirUbicacion(address?: string) {
    if (!address) return;
    const query = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(googleMapsUrl, '_blank');
  }

  accederEvento(link?: string) {
    if (!link) return;
    // Prefer opening in a new tab/window
    window.open(link, '_blank');
  }

  /** Devuelve el nombre del ion-icon para el tipo de contacto */
  getContactIcon(type?: string) {
    if (!type) return 'call-outline';
    const t = type.toLowerCase();
    if (t.includes('whatsapp')) return 'logo-whatsapp';
    if (t.includes('telegram')) return 'paper-plane-outline';
    if (t.includes('instagram')) return 'logo-instagram';
    if (t.includes('facebook')) return 'logo-facebook';
    if (t.includes('email') || t.includes('correo') || t.includes('mail')) return 'mail-outline';
    if (t.includes('telefono') || t.includes('tel') || t.includes('call')) return 'call-outline';
    // default
    return 'person-circle-outline';
  }

}
