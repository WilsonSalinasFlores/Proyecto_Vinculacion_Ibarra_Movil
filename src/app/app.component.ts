import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle, MenuController } from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  home,
  business,
  logOut,
  person,
  document,
  personCircleOutline,
  card,
  personOutline,
  mailOutline,
  callOutline,
  briefcaseOutline,
  createOutline,
  personCircle,
  peopleOutline,
  locationOutline,
  ribbon,
  informationCircleOutline,
  folderOpen,
  documentTextOutline,
  imageOutline,
  cloudUploadOutline,
  resizeOutline,
  trashOutline,
  refresh,
  close,
  personAdd,
  eye,
  eyeOff,
  documentOutline,
  documentAttachOutline,
  download,
  businessOutline,
  handLeftOutline,
  colorPaletteOutline,
  ellipsisHorizontalOutline,
  timeOutline,
  starOutline,
  storefrontOutline,
  filterOutline,
  pricetagOutline,
  calendarOutline,
  statsChartOutline,
  eyeOutline,
  logoFacebook,
  logoInstagram,
  logoWhatsapp,
  logoYoutube,
  logoLinkedin,
  logoTwitter,
  logoTiktok,
  chevronBackOutline,
  chevronForwardOutline,
  chevronDownOutline,
  locateOutline,
  checkmarkOutline,
  closeCircleOutline,
  closeOutline,
  saveOutline,
  settingsOutline,
  imagesOutline,
  checkmarkCircleOutline,
  arrowBack, 
  closeCircle,
  searchOutline,
  create,
  trash,
  logIn,
  helpBuoy,
  helpCircle
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonApp, 
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle
  ],
})
export class AppComponent implements AfterViewInit {
  isAuthenticated$ = this.authService.isAuthenticated$;

  constructor(
    public authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private menuController: MenuController
  ) {
    addIcons({
      home,
      business,
      card,
      document,
      logOut,
      person,
      personCircleOutline,
      personOutline,
      mailOutline,
      callOutline,
      briefcaseOutline,
      createOutline,
      personCircle,
      peopleOutline,
      locationOutline,
      ribbon,
      informationCircleOutline,
      folderOpen,
      documentTextOutline,
      cloudUploadOutline,
      resizeOutline,
      refresh,
      close,
      personAdd,
      eye,
      eyeOff,
      documentOutline,
      documentAttachOutline,
      download,
      businessOutline,
      imageOutline,
      trashOutline,
      handLeftOutline,
      colorPaletteOutline,
      ellipsisHorizontalOutline,
      timeOutline,
      starOutline,
      storefrontOutline,
      filterOutline,
      pricetagOutline,
      calendarOutline,
      statsChartOutline,
      eyeOutline,
      logoFacebook,
      logoInstagram,
      logoWhatsapp,
      logoYoutube,
      logoLinkedin,
      logoTwitter,
      logoTiktok,
      chevronBackOutline,
      chevronForwardOutline,
      chevronDownOutline,
      locateOutline,
      checkmarkOutline,
      closeCircleOutline,
      closeOutline,
      saveOutline,
      settingsOutline,
      imagesOutline,
      checkmarkCircleOutline,
      arrowBack,
      closeCircle,
      searchOutline,
      create,
      trash,
      logIn,
      helpBuoy,
      helpCircle
    });
  }

  async ngAfterViewInit() {
    // Esperar a que el componente ion-menu esté completamente renderizado
    setTimeout(async () => {
      try {
        await this.menuController.enable(true, 'sidebar');
        const isEnabled = await this.menuController.isEnabled('sidebar');
        
        // Forzar la detección de cambios
        if (!isEnabled) {
          await this.menuController.enable(true);
          const retry = await this.menuController.isEnabled('sidebar');
        }
      } catch (error) {
      }
    }, 2000); // Aumentado a 2 segundos
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          handler: () => {
            this.confirmLogout();
          },
        },
      ],
    });

    await alert.present();
  }

  private confirmLogout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
