import { Component, OnInit } from '@angular/core';
import {
  ModalController,
  LoadingController,
  AlertController,
  InfiniteScrollCustomEvent,
  MenuController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  personCircleOutline,
  chevronForwardOutline,
  mapOutline,
  businessOutline,
  calendarOutline,
  restaurantOutline,
  brushOutline,
  shirtOutline,
  constructOutline,
  hardwareChipOutline,
  medkitOutline,
  logOutOutline,
  fastFoodOutline,
  colorPaletteOutline,
  homeOutline,
  buildOutline,
  ellipsisHorizontalOutline,
  helpOutline,
  menu,
} from 'ionicons/icons';
import { LoginPage } from '../login/login.page';
import { Router } from '@angular/router';
import { NegociosService } from '../services/negocios.service';
import { AuthService } from '../services/auth.service';
import { Promocion, PromocionesService } from '../services/promociones.service';
import { BusquedaService } from '../services/busqueda.service';
import { EventosService } from '../eventos/eventos.service';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class HomePage implements OnInit {
  isAuthenticated = false;
  userData: any = null;
  categories: any[] = [];
  promociones: Promocion[] = [];
  promotionTypes = [
    { value: '', label: 'Todas' },
    { value: 'COMBO', label: 'Combo especial' },
    { value: 'DOSXUNO', label: '2x1' },
    { value: 'DESCUENTO_FIJO', label: 'Descuento fijo' },
    { value: 'DESCUENTO_PORCENTAJE', label: 'Descuento %' },
  ];

  selectedPromotionType: string = '';

  onPromotionTypeSelect(value: string) {
    this.selectedPromotionType = value;
    this.loadPromotions(value, this.selectedCategoryId);
  }
  tipoPromocionMap: { [key: string]: string } = {
    COMBO: 'Combo especial',
    DOSXUNO: '2x1',
    DESCUENTO_FIJO: 'Descuento fijo',
    DESCUENTO_PORCENTAJE: 'Descuento %',
  };

  selectedCategoryId: number | undefined = undefined;

  //Sección de Eventos
  mostrarEventos = true;

  getTipoPromocionLabel(tipo: string): string {
    return this.tipoPromocionMap[tipo] || 'Promoción';
  }
  searchTerm: string = '';
  resultadosBusqueda: any[] = [];
  isSearching: boolean = false;
  hasSearchResults: boolean = false;
  currentSearchPage: number = 0;
  searchPageSize: number = 10;
  hasMoreSearchResults: boolean = true;
  totalSearchElements: number = 0;

  // Eventos cargados desde EventosService
  upcomingEvents: any[] = [];

  private loading: HTMLIonLoadingElement | null = null;

  constructor(
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private promocionesService: PromocionesService,
    private router: Router,
    private negociosService: NegociosService,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private busquedaService: BusquedaService,
    private eventosService: EventosService,
    public menuController: MenuController
  ) {
    addIcons({
      locationOutline,
      personCircleOutline,
      chevronForwardOutline,
      mapOutline,
      businessOutline,
      calendarOutline,
      restaurantOutline,
      brushOutline,
      shirtOutline,
      constructOutline,
      hardwareChipOutline,
      medkitOutline,
      logOutOutline,
      fastFoodOutline,
      colorPaletteOutline,
      homeOutline,
      buildOutline,
      ellipsisHorizontalOutline,
      helpOutline,
      menu,
    });
  }

  async ngOnInit() {
    this.checkAuthStatus();
    this.loadCategories();
    this.loadEvents();
    this.setupAuthSubscription();
    this.loadPromotions();
  }
  private async loadEvents() {
    try {
      let eventos = this.eventosService.listarEventos() || [];
      // Si no hay datos locales, intenta cargar desde la API
      if (!eventos.length) {
        const fromApi = await this.eventosService.cargarDesdeApiUrl();
        if (Array.isArray(fromApi) && fromApi.length) {
          eventos = fromApi;
        }
      }

      this.upcomingEvents = (eventos || []).map((ev: any) => ({
        id: ev.id,
        name: ev.name,
        title: ev.name,
        description: ev.description,
        banner: ev.banner || ev.mainBanner,
        image: ev.banner || ev.mainBanner || (ev.images && ev.images[0]?.url),
        date: ev.dateStart || ev.dateEnd,
        services: ev.services || [],
        type: ev.type,
        raw: ev,
      }));
    } catch (err) {
      console.error('Error cargando eventos desde EventosService', err);
      this.upcomingEvents = [];
    }
  }

  onCategorySelect(event: any) {
    this.selectedCategoryId = event.detail.value;
    this.loadPromotions(this.selectedPromotionType, this.selectedCategoryId);
  }

  private menuOpen = false;

  async toggleMenu() {
    try {
      // Obtener referencia al elemento del menú
      const menuElement = document.querySelector('ion-menu');
      if (menuElement) {
        const isOpen = await (menuElement as any).isOpen();
        await (menuElement as any).setOpen(!isOpen);
      }
    } catch (error) {
    }
  }

  openMenu() {
    this.toggleMenu();
  }

  private setupAuthSubscription() {
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isAuthenticated = isAuthenticated;
      if (isAuthenticated) {
        this.userData = this.authService.getCurrentUser();
      } else {
        this.userData = null;
      }
    });
  }

  private checkAuthStatus() {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.userData = this.authService.getCurrentUser();
    }
  }

  private loadPromotions(promotionType?: string, categoryId?: number) {
    this.promocionesService
      .getPromotionPublic(promotionType, categoryId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.promociones = response.data;
          } else {
            console.error('Error loading promotions:', response.message);
          }
        },
        error: (error) => {
          console.error('Error loading promotions:', error);
        },
      });
  }

  onPromotionTypeChange() {
    this.loadPromotions(this.selectedPromotionType);
  }

  private async loadCategories() {
    this.showLoading();
    try {
      const categories = await this.negociosService.getCategorias().toPromise();
      this.categories = (categories || []).map((category) => ({
        ...category,
        icon: this.getCategoryIcon(category.name),
        color: this.getCategoryColor(category.id),
      }));
    } catch (error) {
      console.error('Error loading categories:', error);
      this.showErrorAlert();
    } finally {
      this.hideLoading();
    }
  }

  private getCategoryIcon(categoryName: string): string {
    const iconMap: { [key: string]: string } = {
      Alimentos: 'fast-food-outline',
      Gastronomía: 'restaurant-outline',
      Artesanías: 'color-palette-outline',
      Manualidades: 'construct-outline',
      Salud: 'medkit-outline',
      Textiles: 'shirt-outline',
      Tecnología: 'hardware-chip-outline',
      Decoración: 'home-outline',
      Servicios: 'build-outline',
      Otros: 'ellipsis-horizontal-outline',
    };
    return iconMap[categoryName] || 'help-outline';
  }

  private getCategoryColor(categoryId: number): string {
    const colorMap: { [key: number]: string } = {
      1: '#E53935', // Rojo para alimentos
      2: '#FB8C00', // Naranja para gastronomía
      3: '#8E24AA', // Púrpura para artesanías
      4: '#3949AB', // Azul índigo para manualidades
      5: '#43A047', // Verde para salud
      6: '#FDD835', // Amarillo para textiles/moda
      7: '#00ACC1', // Turquesa para tecnología
      8: '#5E35B1', // Violeta para decoración
      9: '#6D4C41', // Marrón para servicios
      10: '#757575', // Gris para otros
    };
    return colorMap[categoryId] || '#607D8B';
  }

  private async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: 'Cargando...',
      spinner: 'crescent',
    });
    await this.loading.present();
  }

  private async hideLoading() {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }

  private async showErrorAlert() {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'No se pudieron cargar las categorías.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  openCategory(category: any) {
    this.router.navigate(['/negocios'], {
      queryParams: {
        categoria: category.id,
        categoriaNombre: category.name, // Pasamos ambos para mayor seguridad
      },
    });
  }

  openBusiness(business: any) {
    this.router.navigate(['/negocio-detalle', business.id]);
  }

  seeAll(type: string) {
    if (type === 'featured') {
      this.router.navigate(['/negocios']);
    } else if (type === 'events') {
      this.router.navigate(['/eventos']);
    }
  }

  openBusinessById(businessId: number) {
    this.router.navigate(['/detalle-publico', businessId]);
  }

  async openEventDetails(event: any) {
    try {
      const { EventoPage } = await import('../eventos/evento/evento.page');
      const modal = await this.modalCtrl.create({
        component: EventoPage,
        componentProps: { evento: event.raw || event },
        cssClass: 'evento-modal',
      });
      await modal.present();
    } catch (err) {
      console.error('Error abriendo detalle de evento:', err);
    }
  }

  async showWelcomeAlert() {
    const userName =
      this.userData?.name || this.userData?.username || 'usuario';

    const alert = await this.alertController.create({
      header: '¡Bienvenido/a!',
      message: `Hola ${userName}, te has conectado exitosamente.`,
      buttons: ['OK'],
      cssClass: 'welcome-alert',
    });

    await alert.present();
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Sí, Cerrar Sesión',
          handler: () => {
            this.confirmLogout();
          },
        },
      ],
    });

    await alert.present();
  }

  private async confirmLogout() {
    this.authService.logout();
    await this.showLogoutAlert();
    this.router.navigate(['/home']);
  }

  private async showLogoutAlert() {
    const alert = await this.alertController.create({
      header: 'Sesión cerrada',
      message: 'Has cerrado sesión exitosamente.',
      buttons: ['OK'],
      cssClass: 'logout-alert',
    });

    await alert.present();
  }

  //FUNCIONES DEL BUSCADOR
  async searchItems(event: any) {
    const term = event.target.value;
    this.searchTerm = term;

    if (term.trim() === '') {
      this.clearSearch();
      return;
    }

    this.isSearching = true;
    this.currentSearchPage = 0;
    this.hasMoreSearchResults = true;

    try {
      const loading = await this.loadingCtrl.create({
        message: 'Buscando...',
        spinner: 'crescent',
        duration: 3000,
      });
      await loading.present();

      this.busquedaService
        .buscarNegocios(term, this.currentSearchPage, this.searchPageSize)
        .subscribe({
          next: (response) => {
            if (response && response.content) {
              this.resultadosBusqueda = response.content;
              this.hasSearchResults = this.resultadosBusqueda.length > 0;
              this.totalSearchElements = response.totalElements;

              // Verifica si hay más resultados
              this.hasMoreSearchResults =
                this.currentSearchPage + 1 < response.totalPages;
            } else {
              this.resultadosBusqueda = [];
              this.hasSearchResults = false;
              this.totalSearchElements = 0;
              this.hasMoreSearchResults = false;
            }
          },
          error: (error) => {
            console.error('Error en búsqueda:', error);
            this.resultadosBusqueda = [];
            this.hasSearchResults = false;
            this.totalSearchElements = 0;
            this.hasMoreSearchResults = false;
          },
          complete: () => {
            loading.dismiss();
            this.isSearching = false;
          },
        });
    } catch (error) {
      console.error('Error:', error);
      this.isSearching = false;
      this.resultadosBusqueda = [];
      this.hasSearchResults = false;
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.resultadosBusqueda = [];
    this.hasSearchResults = false;
    this.isSearching = false;
    this.currentSearchPage = 0;
    this.hasMoreSearchResults = true;
    this.totalSearchElements = 0;
  }

  loadMoreSearchResults(event: any) {
    if (!this.hasMoreSearchResults || this.isSearching) {
      (event as InfiniteScrollCustomEvent).target.complete();
      return;
    }

    this.currentSearchPage++;

    this.busquedaService
      .buscarNegocios(
        this.searchTerm,
        this.currentSearchPage,
        this.searchPageSize
      )
      .subscribe({
        next: (response) => {
          if (response && response.content) {
            const nuevosResultados = response.content;
            this.resultadosBusqueda = [
              ...this.resultadosBusqueda,
              ...nuevosResultados,
            ];

            // Actualiza si hay más resultados
            this.hasMoreSearchResults =
              this.currentSearchPage + 1 < response.totalPages;
          }
        },
        error: (error) => {
          console.error('Error cargando más resultados:', error);
          this.hasMoreSearchResults = false;
        },
        complete: () => {
          (event as InfiniteScrollCustomEvent).target.complete();
        },
      });
  }

  openBusinessFromSearch(businessId: number) {
    this.router.navigate(['/detalle-publico', businessId]);
    this.clearSearch();
  }

  getBusinessImage(negocio: any): string {
    // Buscar la imagen LOGO primero
    const logo = negocio.photos?.find(
      (photo: any) => photo.photoType === 'LOGO'
    );
    if (logo) return logo.url;

    // Si no hay LOGO, buscar cualquier imagen SLIDE
    const slide = negocio.photos?.find(
      (photo: any) => photo.photoType === 'SLIDE'
    );
    if (slide) return slide.url;

    // Si no hay imágenes, usa una por defecto
    return 'assets/icon/logo-GAD-IBARRA.png';
  }

  onSearchFocus() {}
  navigateTo(page: string) {
    if (page === 'registro-emprendimiento' && !this.isAuthenticated) {
      this.showLoginForRegister();
    } else {
      this.router.navigate([`/${page}`]);
    }
  }

  private async showLoginForRegister() {
    const alert = await this.alertController.create({
      header: 'Acceso requerido',
      message: 'Debes iniciar sesión para registrar un emprendimiento',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Iniciar sesión',
          handler: () => {
            localStorage.setItem('pending_route', '/registro-emprendimiento');
            this.openLogin();
          },
        },
      ],
    });
    await alert.present();
  }
  async openLogin() {
    const modal = await this.modalCtrl.create({
      component: LoginPage,
      cssClass: 'login-modal',
      breakpoints: [0.5, 0.8],
      initialBreakpoint: 0.8,
      backdropDismiss: true,
      componentProps: {
        isModal: true,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.authenticated) {
      this.isAuthenticated = true;
      this.userData = data.userData;
      await this.showWelcomeAlert();
    } else if (data?.navigateToRegister) {
      // Navega al registro cuando el usuario cierra el modal para registrarse
      this.router.navigate(['/registro-app']);
    }
  }
}
