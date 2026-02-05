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
    const s = address.trim();
    // Remover el símbolo de grado (°) si existe
    const point = s.replace(/°/g, '').replace(/, /g, ',');
    // Intentar extraer dos números separados por coma o punto y coma
    
    if (point!='') {
      // Si se encuentran coordenadas, abrir en Google Maps
      
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${point}`;
      window.open(mapsUrl, '_blank');
      return;
    }
    //https://www.google.com/maps/search/?api=1&query=-0.190368,-78.485501
    // Si no son coordenadas, tratar como dirección
    const query = encodeURIComponent(s);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(googleMapsUrl, '_blank');
  }

  accederEvento(link?: string) {
    if (!link) return;
    // Prefer opening in a new tab/window
    window.open(link, '_blank');
  }

  async abrirImagen(src?: string) {
    // Prefer `gallery`, then `images`. Prepend banner/mainBanner if present.
    const imgs: string[] = [];
    if (this.evento?.gallery && this.evento.gallery.length) {
      imgs.push(...this.evento.gallery);
    } else if (this.evento?.images && this.evento.images.length) {
      imgs.push(...this.evento.images.map(i => (typeof i === 'string' ? i : (i.url || ''))).filter(Boolean));
    }
    const bannerUrl = this.evento?.banner || (this.evento as any)?.mainBanner;
    if (bannerUrl && imgs.indexOf(bannerUrl) === -1) imgs.unshift(bannerUrl);
    // if src provided, ensure it's present and compute startIndex
    let startIndex = 0;
    if (src) {
      const idx = imgs.indexOf(src);
      if (idx >= 0) startIndex = idx;
      else imgs.unshift(src); // include it at start if not present
    }
    const { GalleryModalComponent } = await import('../../shared/gallery-modal/gallery-modal.component');
    const modal = await this.modalCtrl.create({
      component: GalleryModalComponent,
      componentProps: { images: imgs, startIndex },
      cssClass: 'gallery-half-modal'
    });
    await modal.present();
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

  formatPhoneDigits(value?: string) {
    if (!value) return '';
    return value.replace(/\D+/g, '');
  }

  whatsappUrl(value?: string) {
    const digits = this.formatPhoneDigits(value);
    if (!digits) return 'https://wa.me/';
    return `https://wa.me/${digits}`;
  }

  isWhatsApp(type?: string) {
    return !!type && type.toLowerCase().includes('whatsapp');
  }

  isPhone(type?: string) {
    return !!type && (type.toLowerCase().includes('telefono') || type.toLowerCase().includes('tel') || type.toLowerCase().includes('call'));
  }

  isEmail(type?: string) {
    return !!type && (type.toLowerCase().includes('email') || type.toLowerCase().includes('correo') || type.toLowerCase().includes('mail'));
  }

  mailtoUrl(value?: string, subject?: string) {
    if (!value) return 'mailto:';
    const m = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const addr = m ? m[0] : value.trim();
    if (!addr) return 'mailto:';
    if (subject) return `mailto:${addr}?subject=${encodeURIComponent(subject)}`;
    return `mailto:${addr}`;
  }

}
