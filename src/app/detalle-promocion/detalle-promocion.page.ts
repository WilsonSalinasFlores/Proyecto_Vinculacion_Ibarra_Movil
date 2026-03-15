import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Promocion, PromocionesService } from '../services/promociones.service';

@Component({
  selector: 'app-detalle-promocion',
  templateUrl: './detalle-promocion.page.html',
  styleUrls: ['./detalle-promocion.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class DetallePromocionPage implements OnInit {
  promocion: Promocion | null = null;
  loading = false;
  error = '';

  private readonly tipoPromocionMap: { [key: string]: string } = {
    COMBO: 'Combo especial',
    DOSXUNO: '2x1',
    DESCUENTO_FIJO: 'Descuento fijo',
    DESCUENTO_PORCENTAJE: 'Descuento %',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private promocionesService: PromocionesService
  ) {}

  ngOnInit(): void {
    const currentNav = this.router.getCurrentNavigation();
    const promoFromState = currentNav?.extras?.state?.['promocion'] as Promocion | undefined;

    if (promoFromState) {
      this.promocion = promoFromState;
      return;
    }

    const promoId = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(promoId) && promoId > 0) {
      this.loadPromotionById(promoId);
      return;
    }

    this.error = 'No se encontró la promoción';
  }

  get tipoPromocionLabel(): string {
    if (!this.promocion?.tipoPromocion) return 'Promoción';
    return this.tipoPromocionMap[this.promocion.tipoPromocion] || 'Promoción';
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  openBusiness(): void {
    if (!this.promocion?.businessId) return;
    this.router.navigate(['/detalle-publico', this.promocion.businessId]);
  }

  private loadPromotionById(promoId: number): void {
    this.loading = true;
    this.error = '';

    this.promocionesService.getPromotionPublic().subscribe({
      next: (response) => {
        if (!response?.success || !Array.isArray(response.data)) {
          this.error = 'No se pudo cargar la promoción';
          return;
        }

        const foundPromotion = (response.data as Promocion[]).find(
          (item) => Number(item.idBusinessPromo) === promoId
        );

        if (!foundPromotion) {
          this.error = 'No se encontró la promoción';
          return;
        }

        this.promocion = foundPromotion;
      },
      error: () => {
        this.error = 'Error al cargar el detalle de la promoción';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
