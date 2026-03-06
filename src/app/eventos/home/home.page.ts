import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonItem,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSelect,
  IonSelectOption,
  IonImg,
  IonGrid,
  IonRow,
  IonCol,
  ModalController, IonLabel, IonButtons, IonBackButton, IonFooter } from '@ionic/angular/standalone';
import { EventosService } from '../eventos.service';
import { environment } from '../../../environments/environment';
import { Evento } from '../evento.model';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonFooter, IonBackButton, IonButtons, 
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonRefresher,
    IonRefresherContent,
    IonChip,
    IonItem,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonImg,
    IonGrid,
    IonRow,
    IonCol,
    CommonModule,
    FormsModule
  ],
  providers: [EventosService]
})
export class HomePage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;

  eventos: Evento[] = [];
  mostrados: Evento[] = [];
  eventosFiltradosPromocion: Evento[] = [];
  paginaIndex = 0;
  readonly INICIAL_COUNT = 3;
  readonly BATCH_SIZE = 5;
  fuenteCount = 0;
  filtroFecha?: string;
  mesSeleccionado?: string; // YYYY-MM
  tieneEventosMes = false;
  eventosEnMes = 0;
  mesesConEventos: { key: string; label: string; count: number }[] = [];

  constructor(private eventosSrv: EventosService, private modalCtrl: ModalController) { }

  ngOnInit() {
    this.cargarInicial();
  }

  async cargarInicial() {
    // Intentar cargar desde la API configurada en environment.apiUrl
    let desdeApi: Evento[] | null = null;
    try {
      const useApiEvents=true;
      if (environment?.apiUrl && useApiEvents) {
        desdeApi = await this.eventosSrv.cargarDesdeApiUrl();
      }
    } catch (e) {
      console.warn('Error al cargar eventos desde API en inicialización', e);
    }

    this.eventos = desdeApi || this.eventosSrv.listarEventos();
    // obtener eventos cuya promoción está activa ahora
    this.eventosFiltradosPromocion = this.obtenerEventosPromocionActiva();
    // ordenar por prioridad (desc) y luego por fechaInicio (asc)
    this.ordenarPorPrioridadYFecha(this.eventosFiltradosPromocion);
    this.fuenteCount = this.eventosFiltradosPromocion.length;
    // mostrar los primeros N eventos (inicial)
    this.mostrados = this.eventosFiltradosPromocion.slice(0, this.INICIAL_COUNT);
    this.paginaIndex = this.mostrados.length;
    // inicializar mes seleccionado al mes actual (no aplicar filtro automáticamente)
    const ahora = new Date();
    this.mesSeleccionado = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}`;
    this.generarMesesConEventos();
    // por defecto mostrar todos en el selector, pero mantener la vista inicial de promociones
    this.mesSeleccionado = 'todos';
    // indicar número de eventos para el indicador del selector (evita mostrar "No hay eventos" al iniciar)
    this.tieneEventosMes = this.eventos.length > 0;
    this.eventosEnMes = this.eventos.length;
  }

  async abrirGaleria(evento: Evento) {
    // Prefer `gallery` (new), then `images` (legacy). Prepend `banner` (new) or `mainBanner` as fallback.
    const imgs: string[] = [];
    if (evento?.gallery && evento.gallery.length) {
      imgs.push(...evento.gallery);
    } else if (evento?.images && evento.images.length) {
      for (const it of evento.images) {
        if (typeof it === 'string') imgs.push(it);
        else if (it && (it.url)) imgs.push(it.url);
      }
    }
    const bannerUrl = evento.banner || (evento as any).mainBanner;
    if (bannerUrl && imgs.indexOf(bannerUrl) === -1) imgs.unshift(bannerUrl);

    const { GalleryModalComponent } = await import('../../shared/gallery-modal/gallery-modal.component');
    const modal = await this.modalCtrl.create({
      component: GalleryModalComponent,
      componentProps: { images: imgs },
      cssClass: 'gallery-half-modal'
    });
    await modal.present();
  }

  async abrirDetalles(evento: Evento) {
    // Abrir la page `EventoPage` como modal pasando el objeto `evento` (estructura API)
    const { EventoPage } = await import('../evento/evento.page');
    const modal = await this.modalCtrl.create({
      component: EventoPage,
      componentProps: { evento }
    });
    await modal.present();
  }
  async mostrarNuevos(event?: any) {
    const fuente = this.obtenerFuenteActual();
    const desde = this.paginaIndex;
    const hasta = this.paginaIndex + this.BATCH_SIZE;
    const nuevos = fuente.slice(desde, hasta);
    if (nuevos && nuevos.length) {
      this.mostrados = this.mostrados.concat(nuevos);
      // mantener orden: prioridad desc, fechaInicio asc
      this.ordenarPorPrioridadYFecha(this.mostrados);
      this.paginaIndex = this.mostrados.length;
    }
    if (event && event.target) event.target.complete();
  }

  async mostrarAnteriores(event?: any) {
    // Al deslizar hacia arriba: recargar completamente la página
    this.cargarInicial();
    if (event && event.target) event.target.complete();
    await this.content.scrollToTop(200);
  }

  filtrarPorFecha() {
    if (!this.filtroFecha) { this.cargarInicial(); return; }
    const fechaSel = new Date(this.filtroFecha).setHours(0,0,0,0);
    this.mostrados = this.eventos.filter(ev => {
      const inicio = new Date(ev.dateStart).setHours(0,0,0,0);
      return inicio === fechaSel;
    });
    this.ordenarPorPrioridadYFecha(this.mostrados);
    this.paginaIndex = this.mostrados.length;
    this.fuenteCount = this.mostrados.length;
  }

  comprobarMesConEventos() {
    this.tieneEventosMes = false;
    this.eventosEnMes = 0;
    if (!this.mesSeleccionado || this.mesSeleccionado === 'todos') {
      // mostrar todos (cuando el usuario elige 'Todos' mostramos todos los eventos
      // ordenados por prioridad y fecha)
      this.tieneEventosMes = this.eventos.length > 0;
      this.eventosEnMes = this.eventos.length;
      const fuente = [...this.eventos];
      this.ordenarPorPrioridadYFecha(fuente);
      this.fuenteCount = fuente.length;
      this.mostrados = fuente.slice(0, this.INICIAL_COUNT);
      this.paginaIndex = this.mostrados.length;
      return;
    }
    const [y, m] = this.mesSeleccionado.split('-').map(v => parseInt(v, 10));
    const year = y;
    const month = m - 1;
    const mesInicio = new Date(year, month, 1, 0, 0, 0, 0).getTime();
    const mesFin = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

    this.eventosEnMes = 0;
    this.eventos.forEach(ev => {
      const inicioEv = new Date(ev.dateStart).getTime();
      const finEv = new Date(ev.dateEnd).getTime();
      if (finEv >= mesInicio && inicioEv <= mesFin) {
        this.eventosEnMes += 1;
      }
    });
    this.tieneEventosMes = this.eventosEnMes > 0;
    // filtrar mostrados por mes
    this.mostrados = this.eventos.filter(ev => {
      const inicioEv = new Date(ev.dateStart).getTime();
      const finEv = new Date(ev.dateEnd).getTime();
      return finEv >= mesInicio && inicioEv <= mesFin;
    });
    this.ordenarPorPrioridadYFecha(this.mostrados);
    this.paginaIndex = this.mostrados.length;
  }

  private obtenerEventosPromocionActiva(): Evento[] {
    const ahora = Date.now();
    return this.eventos.filter(ev => {
      const inicioPromo = ev.inicioPromocion ? new Date(ev.inicioPromocion).getTime() : -Infinity;
      const finPromo = ev.finPromocion ? new Date(ev.finPromocion).getTime() : Infinity;
      return inicioPromo <= ahora && ahora <= finPromo;
    });
  }

  private ordenarPorPrioridadYFecha(arr: Evento[]) {
    if (!arr) return;
    arr.sort((a, b) => this.compararFechaLuegoPrioridad(a, b));
  }

  private compararFechaLuegoPrioridad(a: Evento, b: Evento): number {
    const da = new Date(a.dateStart).getTime();
    const db = new Date(b.dateStart).getTime();
    if (da !== db) return da - db; // fechaInicio ascendente
    const pa = a.prioridad ?? 0;
    const pb = b.prioridad ?? 0;
    return pb - pa; // prioridad descendente (mayor prioridad primero)
  }

  private obtenerFuenteActual(): Evento[] {
    // Si hay un filtro de fecha específico
    if (this.filtroFecha) {
      const fechaSel = new Date(this.filtroFecha).setHours(0,0,0,0);
      const arr = this.eventos.filter(ev => new Date(ev.dateStart).setHours(0,0,0,0) === fechaSel);
      this.ordenarPorPrioridadYFecha(arr);
      this.fuenteCount = arr.length;
      return arr;
    }
    // Si se ha seleccionado un mes distinto a 'todos'
    if (this.mesSeleccionado && this.mesSeleccionado !== 'todos') {
      const [y, m] = this.mesSeleccionado.split('-').map(v => parseInt(v, 10));
      const year = y;
      const month = m - 1;
      const mesInicio = new Date(year, month, 1, 0, 0, 0, 0).getTime();
      const mesFin = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
      const arr = this.eventos.filter(ev => {
        const inicioEv = new Date(ev.dateStart).getTime();
        const finEv = new Date(ev.dateEnd).getTime();
        return finEv >= mesInicio && inicioEv <= mesFin;
      });
      this.ordenarPorPrioridadYFecha(arr);
      this.fuenteCount = arr.length;
      return arr;
    }
    // por defecto: la lista de promociones activas
    this.fuenteCount = (this.eventosFiltradosPromocion || []).length;
    return this.eventosFiltradosPromocion || [];
  }

  generarMesesConEventos() {
    const mesesMap: Record<string, { key: string; label: string; count: number }> = {};
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    this.eventos.forEach(ev => {
      const inicio = new Date(ev.dateStart);
      const fin = new Date(ev.dateEnd);
      const cur = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
      const end = new Date(fin.getFullYear(), fin.getMonth(), 1);
      while (cur.getTime() <= end.getTime()) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}`;
        if (!mesesMap[key]) {
          mesesMap[key] = { key, label: `${nombres[cur.getMonth()]} ${cur.getFullYear()}`, count: 0 };
        }
        mesesMap[key].count += 1;
        cur.setMonth(cur.getMonth()+1);
      }
    });
    this.mesesConEventos = Object.values(mesesMap).sort((a,b)=> a.key.localeCompare(b.key));
    // añadir opción 'todos' al inicio
    this.mesesConEventos.unshift({ key: 'todos', label: 'Todos', count: this.eventos.length });
  }



}
