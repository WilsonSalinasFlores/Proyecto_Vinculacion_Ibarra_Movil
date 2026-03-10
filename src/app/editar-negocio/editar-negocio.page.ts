import { ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Business, DetallePrivadoService } from '../services/detalle-privado.service';
import { NegociosService } from '../services/negocios.service';
import { EditarNegocioService } from '../services/editar-negocio.service';
import { ToastService } from '../services/toast.service';
import { lastValueFrom } from 'rxjs';

declare var L: any;

@Component({
  selector: 'app-editar-negocio',
  templateUrl: './editar-negocio.page.html',
  styleUrls: ['./editar-negocio.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
})
export class EditarNegocioPage implements OnInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  editBusiness!: FormGroup;
  logoFile!: File;

  businessId!: string;
  validationStatus!: string;
  backUrl!: string;
  business: Business | null = null;
  carrouselPhotos: File[] = [];
  categories: any[] = [];
  selectedCategoryId: number | undefined = undefined;
  isLoading = false;
  map: any;
  marker: any;
  showMap = false;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private detallePrivadoService: DetallePrivadoService,
    private negociosService: NegociosService,
    private eeditarNegocioService: EditarNegocioService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.initializeForm();
  }

  async ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('id')!;
    this.validationStatus = this.route.snapshot.paramMap.get('validationStatus')!;
    this.backUrl = `/detalle-negocio/${this.businessId}`;
    
    // Cargar datos
    await this.loadBusinessDetails();
    this.loadCategories();
    await this.loadLeafletScript();
  }

  private async loadLeafletScript() {
    if (typeof L !== 'undefined') {
      return;
    }

    return new Promise<void>((resolve) => {
      // CSS de Leaflet
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // Script de Leaflet
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private initializeForm() {
    this.editBusiness = this.fb.group({
      categoryId: ["", [Validators.required]],
      commercialName: ["", [Validators.required, Validators.maxLength(100)]],
      countryCodePhone: ['+593', Validators.required],
      countryCode: ['+593', Validators.required],
      phone: ['', [Validators.required, Validators.maxLength(9), Validators.pattern('^[0-9]+$')]],
      website: ['', [Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      acceptsWhatsappOrders: [false],
      whatsappNumber: [''],
      googleMapsCoordinates: ['', [Validators.required, Validators.maxLength(100)]],
      deliveryService: ['NO', [Validators.pattern('NO|SI|BAJO_PEDIDO')]],
      salePlace: ['NO', [Validators.pattern('NO|FERIAS|LOCAL_FIJO')]],
      facebook: ['', [Validators.maxLength(100)]],
      instagram: ['', [Validators.maxLength(100)]],
      tiktok: ['', [Validators.maxLength(100)]],
      address: ['', [Validators.required, Validators.maxLength(100)]],
      schedules: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.email, Validators.maxLength(100)]]
    });

    this.editBusiness.get('acceptsWhatsappOrders')?.valueChanges.subscribe(accepts => {
      const whatsappControl = this.editBusiness.get('whatsappNumber');
      if (accepts) {
        whatsappControl?.setValidators([
          Validators.required,
          Validators.maxLength(9),
          Validators.pattern('^[0-9]+$')
        ]);
      } else {
        whatsappControl?.clearValidators();
      }
      whatsappControl?.updateValueAndValidity();
    });
  }

  // Método para extraer solo el número de teléfono sin código de país
  private extractPhoneNumber(fullPhone: string): string {
    if (!fullPhone) return '';
    
    // Remover espacios y caracteres no numéricos excepto el +
    const cleaned = fullPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Si empieza con +593, removerlo
    if (cleaned.startsWith('+593')) {
      return cleaned.substring(4); // Remover +593
    }
    
    // Si empieza con 593, removerlo
    if (cleaned.startsWith('593')) {
      return cleaned.substring(3); // Remover 593
    }
    
    // Si empieza con +, remover solo el +
    if (cleaned.startsWith('+')) {
      return cleaned.substring(1);
    }
    
    return cleaned;
  }

  // Método para extraer número de WhatsApp sin código de país
  private extractWhatsAppNumber(fullWhatsApp: string): string {
    if (!fullWhatsApp) return '';
    
    // Remover espacios y caracteres no numéricos excepto el +
    const cleaned = fullWhatsApp.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Si empieza con +593, removerlo
    if (cleaned.startsWith('+593')) {
      return cleaned.substring(4); // Remover +593
    }
    
    // Si empieza con 593, removerlo
    if (cleaned.startsWith('593')) {
      return cleaned.substring(3); // Remover 593
    }
    
    // Si empieza con +, remover solo el +
    if (cleaned.startsWith('+')) {
      return cleaned.substring(1);
    }
    
    return cleaned;
  }

  // Método para formatear schedules al mostrar en formulario
  private formatSchedulesForDisplay(schedules: any): string {
    if (!schedules) return '';
    
    // Convertir todo a string primero
    let result = '';
    
    if (typeof schedules === 'string') {
      result = schedules;
    } else if (Array.isArray(schedules)) {
      result = schedules.length === 1 ? schedules[0] : schedules.join(', ');
    } else {
      result = String(schedules);
    }
    
    // Limpiar agresivamente: remover [ ] " ' al inicio y final
    result = result.trim()
      .replace(/^\[+/, '')      // Quitar [ del inicio
      .replace(/\]+$/, '')      // Quitar ] del final
      .replace(/^"+/, '')       // Quitar " del inicio
      .replace(/"+$/, '')       // Quitar " del final
      .replace(/^'+/, '')       // Quitar ' del inicio
      .replace(/'+$/, '')       // Quitar ' del final
      .trim();
    
    return result;
  }

  // Método para normalizar el estado de validación
  private normalizeValidationStatus(status: string): string {
    if (!status) return 'UNKNOWN';
    
    const normalizedStatus = status.toUpperCase().trim();
    
    // Mapear  variaciones
    const statusMap: { [key: string]: string } = {
     
      'VALIDATED': 'APPROVED', 
      'VALIDADO': 'APPROVED',   
     
    };
    
    return statusMap[normalizedStatus] || normalizedStatus;
  }

  // Método alternativo más robusto para verificar estados
  private getBusinessStatus(status: string): 'REJECTED' | 'APPROVED' | 'PENDING' | 'UNKNOWN' {
    if (!status) return 'UNKNOWN';
    
    const normalizedStatus = status.toUpperCase().trim();
    
    // Estados que indican negocio rechazado
    if (['REJECTED', 'RECHAZADO', 'DENIED'].includes(normalizedStatus)) {
      return 'REJECTED';
    }
    
    // Estados que indican negocio aprobado/validado
    if (['APPROVED', 'APROBADO', 'ACEPTADO', 'ACCEPTED', 'VALIDATED', 'VALIDADO'].includes(normalizedStatus)) {
      return 'APPROVED';
    }
    
    // Estados que indican negocio pendiente
    if (['PENDING', 'PENDIENTE', 'EN_REVISION', 'REVISION'].includes(normalizedStatus)) {
      return 'PENDING';
    }
    
    return 'UNKNOWN';
  }

  // Método para verificar si es un negocio rechazado
  isRejectedBusiness(): boolean {
    const status = this.getBusinessStatus(this.validationStatus);
    return status === 'REJECTED';
  }

  // Método para verificar si es un negocio aceptado o pendiente
  isAcceptedOrPendingBusiness(): boolean {
    const status = this.getBusinessStatus(this.validationStatus);
    return ['PENDING', 'APPROVED'].includes(status);
  }

  // Método adicional para verificar si está validado/aprobado específicamente
  isValidatedBusiness(): boolean {
    const status = this.getBusinessStatus(this.validationStatus);
    return status === 'APPROVED';
  }

  // Método mejorado para deshabilitar campos según el estado
  private disableFieldsBasedOnStatus() {
    if (this.isAcceptedOrPendingBusiness()) {
      // Para negocios aceptados/pendientes - deshabilitar campos no editables
      const fieldsToDisable = [
        'categoryId',
        'deliveryService',
        'salePlace'
      ];
      
      fieldsToDisable.forEach(field => {
        this.editBusiness.get(field)?.disable();
      });
    }
  }

  // Método mejorado para verificar si un campo debe mostrarse
  isFieldEditable(fieldName: string): boolean {
    const isRejected = this.isRejectedBusiness();
    if (isRejected) {
      return true; // Todos los campos editables para rechazados
    }
    
    // Para PENDING/APPROVED - solo estos campos son editables
    const editableFields = [
      'commercialName',
      'description', 
      'facebook',
      'instagram',
      'tiktok', 
      'website',
      'phone',
      'email',
      'acceptsWhatsappOrders',
      'whatsappNumber',
      'address',
      'googleMapsCoordinates',
      'schedules',
      'countryCodePhone',
      'countryCode'
    ];

    return editableFields.includes(fieldName);
  }

  hasError(controlName: string): boolean {
    const control = this.editBusiness.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(controlName: string): string {
    const control = this.editBusiness.get(controlName);
    if (!control || !control.errors) return '';

    const genericMessages: Record<string, string> = {
      required: 'Este campo es obligatorio',
      maxlength: `Máximo ${control.errors['maxlength']?.requiredLength} caracteres`,
      email: 'Formato de correo inválido',
      pattern: 'Formato inválido',
      min: `Valor mínimo: ${control.errors['min']?.min}`,
      max: `Valor máximo: ${control.errors['max']?.max}`
    };

    for (const error in control.errors) {
      if (genericMessages[error]) return genericMessages[error];
    }

    return 'Campo inválido';
  }

  // Método mejorado para cargar detalles del negocio
  async loadBusinessDetails(): Promise<void> {
    try {
      const business = await lastValueFrom(
        this.detallePrivadoService.getBusinessDetails(Number(this.businessId))
      );

      this.business = business;

      // ACTUALIZAR EL ESTADO DE VALIDACIÓN desde los datos del negocio
      if (business.validationStatus) {
        this.validationStatus = business.validationStatus;
      }

      // Extraer solo el número de teléfono sin código de país
      const phoneNumberOnly = this.extractPhoneNumber(business.phone || '');

      // Extraer solo el número de WhatsApp sin código de país( restricción 9 dígitos)
      const whatsappNumberOnly = this.extractWhatsAppNumber(business.whatsappNumber || '');

      // Formatear schedules: si es array, convertir a string limpio
      const schedulesValue = this.formatSchedulesForDisplay(business.schedules);
      
      this.editBusiness.patchValue({
        categoryId: business.category?.id,
        commercialName: business.commercialName,
        countryCodePhone: '+593', 
        countryCode: '+593',       
        phone: phoneNumberOnly,    
        website: business.website,
        description: business.description,
        acceptsWhatsappOrders: business.acceptsWhatsappOrders,
        whatsappNumber: whatsappNumberOnly, 
        googleMapsCoordinates: business.googleMapsCoordinates,
        deliveryService: business.deliveryService,
        salePlace: business.salePlace,
        facebook: business.facebook,
        instagram: business.instagram,
        tiktok: business.tiktok,
        address: business.address,
        schedules: schedulesValue,
        email: business.email
      });

      // Deshabilitar campos según el estado después de cargar los datos
      this.disableFieldsBasedOnStatus();
      
    } catch (error) {
      console.error('Error loading business details:', error);
      await this.toastService.show('Error cargando los detalles del negocio', 'danger');
    }
  }

  private async loadCategories() {
    try {
      const categories = await this.negociosService.getCategorias().toPromise();
      this.categories = (categories || []).map((category) => ({
        ...category,
      }));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async onSubmit() {
    if (this.editBusiness.invalid) {
      await this.toastService.show(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
      return;
    }
    
    this.ngZone.run(() => {
      this.isLoading = true;
    });
    
    try {
      const formValue = this.editBusiness.value;
      const businessStatus = this.getBusinessStatus(this.validationStatus);
      
      // Condición según el estado de validación
      if (businessStatus === 'REJECTED') {
        await this.updateRejectedBusiness(formValue);
      } else if (['APPROVED', 'PENDING'].includes(businessStatus)) {
        await this.updateAcceptedBusiness(formValue);
      } else {
        await this.updateAcceptedBusiness(formValue);
      }
      
      // Liberar isLoading ANTES de cualquier otra cosa
      this.ngZone.run(() => {
        this.isLoading = false;
      });
      
      // Navegar inmediatamente con queryParams para mostrar mensaje de éxito
      await this.router.navigate([`/detalle-negocio/${this.businessId}`], {
        queryParams: { updated: 'true' }
      });
      
    } catch (error: any) {
      // Liberar isLoading en caso de error
      this.ngZone.run(() => {
        this.isLoading = false;
      });
      
      const errorMessage = error?.message || 'Error actualizando el negocio';
      await this.toastService.show(errorMessage, 'danger');
    }
  }

  // Método para actualizar negocios RECHAZADOS (FormDatatodos los campos)
  private async updateRejectedBusiness(formValue: any) {
    const fullWhatsApp = formValue.acceptsWhatsappOrders
      ? `${formValue.countryCode}${formValue.whatsappNumber}`
      : '';
    const fullPhone = `${formValue.countryCodePhone}${formValue.phone}`;
    
    const businessData = {
      ...formValue,
      phone: fullPhone,
      whatsappNumber: fullWhatsApp,
    };
    
    const formData = new FormData();
    formData.append(
      'business',
      new Blob([JSON.stringify(businessData)], { type: 'application/json' })
    );
    
    if (this.logoFile) {
      formData.append('logoFile', this.logoFile);
    }
    
    if (this.carrouselPhotos && this.carrouselPhotos.length > 0) {
      this.carrouselPhotos.forEach((file) => {
        formData.append('carouselFiles', file);
      });
    }
    
    await lastValueFrom(this.eeditarNegocioService.updateBusiness(Number(this.businessId), formData));
  }

  // Método para actualizar negocios PENDIENTES o APROBADOS (JSON campos limitados)
  private async updateAcceptedBusiness(formValue: any) {
    const fullWhatsApp = formValue.acceptsWhatsappOrders
      ? `${formValue.countryCode}${formValue.whatsappNumber}`
      : '';
    const fullPhone = `${formValue.countryCodePhone}${formValue.phone}`;
    
    // Solo los campos permitidos para negocios aceptados/pendientes
    const businessData = {
      commercialName: formValue.commercialName,
      description: formValue.description,
      facebook: formValue.facebook || '',
      instagram: formValue.instagram || '',
      tiktok: formValue.tiktok || '',
      website: formValue.website || '',
      phone: fullPhone,
      email: formValue.email || '',
      acceptsWhatsappOrders: formValue.acceptsWhatsappOrders || false,
      whatsappNumber: fullWhatsApp,
      address: formValue.address,
      googleMapsCoordinates: formValue.googleMapsCoordinates,
      schedules: Array.isArray(formValue.schedules) 
        ? formValue.schedules 
        : [formValue.schedules] // Convertir a array si es string
    };
    
    await lastValueFrom(this.eeditarNegocioService.updateBusinessAccepted(Number(this.businessId), businessData));
  }

  //  MÉTODOS DEL MAPA 
  openMap() {
    this.showMap = true;
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  closeMap() {
    this.showMap = false;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    if (!this.mapContainer || this.map) return;

    // Coordenadas por defecto (Ibarra, Ecuador)
    const defaultLat = 0.3516;
    const defaultLng = -78.1225;

    this.map = L.map(this.mapContainer.nativeElement).setView([defaultLat, defaultLng], 13);

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Agregar marcador inicial
    this.marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(this.map);

    // Evento cuando se hace clic en el mapa
    this.map.on('click', (e: any) => {
      this.updateMarkerPosition(e.latlng);
    });

    // Evento cuando se arrastra el marcador
    this.marker.on('dragend', (e: any) => {
      this.updateMarkerPosition(e.target.getLatLng());
    });

    // Intentar obtener ubicación actual
    this.getCurrentLocation();
  }

  private updateMarkerPosition(latlng: any) {
    if (this.marker) {
      this.marker.setLatLng(latlng);
    }

    const coordinates = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    this.editBusiness.patchValue({
      googleMapsCoordinates: coordinates
    });
  }

  private getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.map.setView([lat, lng], 15);
          this.updateMarkerPosition({ lat, lng });
        },
        (error) => {
          console.warn('Error obteniendo ubicación:', error);
        }
      );
    }
  }

  centerOnCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.map.setView([lat, lng], 15);
          this.updateMarkerPosition({ lat, lng });
          this.toastService.show('Ubicación actualizada', 'success');
        },
        (error) => {
          this.toastService.show('No se pudo obtener la ubicación actual', 'warning');
        }
      );
    } else {
      this.toastService.show('Geolocalización no disponible', 'warning');
    }
  }

  confirmLocation() {
    const coordinates = this.editBusiness.get('googleMapsCoordinates')?.value;
    if (coordinates) {
      this.closeMap();
      this.toastService.show('Ubicación seleccionada correctamente', 'success');
    } else {
      this.toastService.show('Por favor selecciona una ubicación en el mapa', 'warning');
    }
  }

  // =================== MÉTODOS DE IMÁGENES ===================
  async onFileChange(event: Event | DragEvent, tipo: 'logoFile' | 'carrouselPhotos') {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    const files = input?.files?.length ? input.files : (event as DragEvent).dataTransfer?.files;

    if (!files || files.length === 0) {
      return;
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (!extension || !allowedExtensions.includes(extension)) {
        await this.toastService.show(
          `Formato no permitido para ${file.name}. Solo JPG o PNG`,
          'warning'
        );
        continue;
      }

      if (file.size > maxSize) {
        await this.toastService.show(
          `El archivo ${file.name} supera los 2 MB`,
          'warning'
        );
        continue;
      }

      try {
        const isValidSize = await this.validateImageDimensions(file);
        if (!isValidSize) {
          await this.toastService.show(
            `${file.name} debe tener mínimo 800x600 píxeles`,
            'warning'
          );
          continue;
        }
      } catch (error) {
        console.warn('Error validando dimensiones:', error);
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (input) input.value = '';
      return;
    }

    if (tipo === 'logoFile') {
      this.logoFile = validFiles[0];
    } else if (tipo === 'carrouselPhotos') {
      const totalImages = this.carrouselPhotos.length + validFiles.length;
      if (totalImages > 5) {
        await this.toastService.show(
          'Máximo 5 imágenes permitidas en el carrusel',
          'warning'
        );
        return;
      }
      this.carrouselPhotos = [...this.carrouselPhotos, ...validFiles];
    }

    await this.toastService.show(
      `${validFiles.length} archivo(s) cargado(s) correctamente`,
      'success'
    );
  }

  private validateImageDimensions(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img.width >= 800 && img.height >= 600);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };

      img.src = url;
    });
  }

  onDrop(event: DragEvent, tipo: 'logoFile' | 'carrouselPhotos') {
    event.preventDefault();
    this.onFileChange(event, tipo);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  removeFile(tipo: 'logoFile' | 'carrouselPhotos') {
    if (tipo === 'logoFile') {
      this.logoFile = null as any;
      const input = document.getElementById('logoFileInput') as HTMLInputElement;
      if (input) input.value = '';
    }
  }

  removeCarrouselPhoto(index: number) {
    this.carrouselPhotos.splice(index, 1);
    this.toastService.show('Foto eliminada', 'success');
  }

  goBack() {
    this.router.navigate(['/detalle-negocio', this.businessId]);
  }
}