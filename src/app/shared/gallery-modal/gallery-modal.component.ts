import { Component, Input, AfterViewInit, ViewChildren, QueryList, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, ModalController, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gallery-modal',
  templateUrl: './gallery-modal.component.html',
  styleUrls: ['./gallery-modal.component.scss'],
  standalone: true,
  imports: [IonTitle, CommonModule, NgForOf, NgIf, IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon]
})
export class GalleryModalComponent {
  @Input() images: string[] = [];
  @Input() startIndex = 0;

  @ViewChildren('galleryImg', { read: ElementRef }) imgs!: QueryList<ElementRef<HTMLImageElement>>;
  @ViewChild('carousel', { read: ElementRef }) carousel?: ElementRef<HTMLDivElement>;

  currentIndex = 0;

  zoomedIndex = -1;

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }

  ngAfterViewInit() {
    // Scroll to the requested startIndex after view init
    setTimeout(() => {
      const idx = Math.max(0, Math.min(this.startIndex || 0, this.images.length - 1));
      const arr = this.imgs.toArray();
      if (arr && arr[idx]) {
        try { arr[idx].nativeElement.scrollIntoView({ behavior: 'auto', block: 'center' }); } catch (e) {}
      }
    }, 50);
  }

  onCarouselScroll() {
    if (!this.carousel) return;
    const el = this.carousel.nativeElement;
    const slideWidth = el.clientWidth;
    const idx = Math.round(el.scrollLeft / slideWidth);
    this.currentIndex = Math.min(Math.max(0, idx), this.images.length - 1);
  }

  next() {
    if (!this.carousel) return;
    const el = this.carousel.nativeElement;
    const target = Math.min(this.currentIndex + 1, this.images.length - 1);
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
  }

  prev() {
    if (!this.carousel) return;
    const el = this.carousel.nativeElement;
    const target = Math.max(this.currentIndex - 1, 0);
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
  }

  toggleZoom(index: number) {
    this.zoomedIndex = this.zoomedIndex === index ? -1 : index;
  }
}
