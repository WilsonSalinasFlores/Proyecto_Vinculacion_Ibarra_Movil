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
  IonButton,
  IonIcon,
  IonChip,
  IonItem,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSelect,
  IonSelectOption,
  IonImg,
  ModalController, IonLabel } from '@ionic/angular/standalone';
import { EventosService } from '../eventos.service';
import { Evento } from '../evento.model';
import { GaleriaPage } from '../galeria/galeria.page';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
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
    IonButton,
    IonIcon,
    IonChip,
    IonItem,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonImg,
    CommonModule,
    FormsModule
  ],
  providers: [EventosService]
})
export class HomePage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;

  eventos: Evento[] = [];
  mostrados: Evento[] = [];
  paginaIndex = 0;
  filtroFecha?: string;
  mesSeleccionado?: string; // YYYY-MM
  tieneEventosMes = false;
  eventosEnMes = 0;
  mesesConEventos: { key: string; label: string; count: number }[] = [];

  constructor(private eventosSrv: EventosService, private modalCtrl: ModalController) { }

  ngOnInit() {
    this.cargarInicial();
  }

  cargarInicial() {
    this.eventos = this.eventosSrv.listarEventos();
    this.mostrados = this.eventosSrv.obtenerMasCercanos(5);
    this.paginaIndex = this.mostrados.length;
    // inicializar mes seleccionado al mes actual
    const ahora = new Date();
    this.mesSeleccionado = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}`;
    this.generarMesesConEventos();
    // por defecto mostrar todos
    this.mesSeleccionado = 'todos';
    this.comprobarMesConEventos();
  }

  async abrirGaleria(evento: Evento) {
    const modal = await this.modalCtrl.create({
      component: GaleriaPage,
      componentProps: { imagenes: evento.galeria, titulo: evento.titulo }
    });
    await modal.present();
  }

  async abrirMapa(evento: Evento) {
    const lat = evento.ubicacion.lat;
    const lng = evento.ubicacion.lng;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    // Abrir con el comportamiento nativo / fallback
    try {
      window.open(url, '_system');
    } catch (e) {
      window.open(url, '_blank');
    }
  }

  contactar(evento: Evento) {
    if (evento.contacto) {
      try {
        window.location.href = `tel:${evento.contacto}`;
      } catch (e) {
        window.open(`tel:${evento.contacto}`, '_blank');
      }
    }
  }

  async mostrarNuevos(event?: any) {
    const nuevos = this.eventosSrv.cargarNuevos(this.paginaIndex, 5);
    this.mostrados = this.mostrados.concat(nuevos);
    this.paginaIndex = this.mostrados.length;
    if (event && event.target) event.target.complete();
  }

  async mostrarAnteriores(event?: any) {
    // Si no hay eventos mostrados, recargar lista inicial
    if (!this.mostrados || this.mostrados.length === 0) {
      this.cargarInicial();
      if (event && event.target) event.target.complete();
      return;
    }

    const anteriores = this.eventosSrv.cargarAnteriores(this.paginaIndex, 5);
    this.mostrados = anteriores.concat(this.mostrados);
    this.paginaIndex = this.mostrados.length;
    if (event && event.target) event.target.complete();
    await this.content.scrollToTop(200);
  }

  filtrarPorFecha() {
    if (!this.filtroFecha) { this.cargarInicial(); return; }
    const fechaSel = new Date(this.filtroFecha).setHours(0,0,0,0);
    this.mostrados = this.eventos.filter(ev => {
      const inicio = new Date(ev.fechaInicio).setHours(0,0,0,0);
      return inicio === fechaSel;
    });
  }

  comprobarMesConEventos() {
    this.tieneEventosMes = false;
    this.eventosEnMes = 0;
    if (!this.mesSeleccionado || this.mesSeleccionado === 'todos') {
      // mostrar todos
      this.tieneEventosMes = this.eventos.length > 0;
      this.eventosEnMes = this.eventos.length;
      this.mostrados = this.eventosSrv.obtenerMasCercanos(5);
      return;
    }
    const [y, m] = this.mesSeleccionado.split('-').map(v => parseInt(v, 10));
    const year = y;
    const month = m - 1;
    const mesInicio = new Date(year, month, 1, 0, 0, 0, 0).getTime();
    const mesFin = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

    this.eventosEnMes = 0;
    this.eventos.forEach(ev => {
      const inicioEv = new Date(ev.fechaInicio).getTime();
      const finEv = new Date(ev.fechaFin).getTime();
      if (finEv >= mesInicio && inicioEv <= mesFin) {
        this.eventosEnMes += 1;
      }
    });
    this.tieneEventosMes = this.eventosEnMes > 0;
    // filtrar mostrados por mes
    this.mostrados = this.eventos.filter(ev => {
      const inicioEv = new Date(ev.fechaInicio).getTime();
      const finEv = new Date(ev.fechaFin).getTime();
      return finEv >= mesInicio && inicioEv <= mesFin;
    });
  }

  generarMesesConEventos() {
    const mesesMap: Record<string, { key: string; label: string; count: number }> = {};
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    this.eventos.forEach(ev => {
      const inicio = new Date(ev.fechaInicio);
      const fin = new Date(ev.fechaFin);
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

  desmarcarSeleccion() {
    this.filtroFecha = undefined;
    this.mesSeleccionado = undefined;
    this.tieneEventosMes = false;
    this.eventosEnMes = 0;
    this.cargarInicial();
  }

}
