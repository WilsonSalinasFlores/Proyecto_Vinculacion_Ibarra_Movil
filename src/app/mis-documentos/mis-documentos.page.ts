import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule} from '@ionic/angular';
import { DocumentosService } from '../services/documentos.service';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Directory, Filesystem } from '@capacitor/filesystem';

@Component({
  selector: 'app-mis-documentos',
  templateUrl: './mis-documentos.page.html',
  styleUrls: ['./mis-documentos.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class MisDocumentosPage implements OnInit {
  loading = false;

  constructor(private documentosService: DocumentosService, private router: Router) {}

  ngOnInit() {}

  verIdentidad() {
    this.cargarYDescargarDocumento('cedula', 'documento-identidad');
  }

  verComprobante() {
    this.loading = true;
    this.documentosService.getDocumentoPdf('comprobante').subscribe({
      next: async (response: Blob) => {
        try {
          const contentType = response.type || '';
          const isJson = contentType.includes('application/json') || contentType.includes('text/plain');

          if (isJson) {
            const text = await response.text();
            const data = JSON.parse(text);
            const url = data?.paymentReceiptUrl;

            if (url) {
              await this.abrirUrlExterna(url);
              return;
            }
          }

          await this.manejarDescargaPdf(response, 'comprobante-pago');
        } catch (error) {
          console.error('Error al procesar el comprobante', error);
        }
      },
      error: (err) => {
        console.error('Error al obtener el comprobante de pago', err);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  verCertificado() {
    this.cargarYDescargarDocumento('certificado', 'certificado-emprendedor');
  }

  verFirmado() {
    this.cargarYDescargarDocumento('firmado', 'acuerdo-comercializacion');
  }

  private cargarYDescargarDocumento(
    tipoDocumento: 'cedula' | 'certificado' | 'firmado',
    nombreArchivoBase: string
  ): void {
    this.loading = true;
    this.documentosService.getDocumentoPdf(tipoDocumento).subscribe({
      next: async (blob) => {
        await this.manejarDescargaPdf(blob, nombreArchivoBase);
      },
      error: (err) => {
        console.error(`Error al obtener el documento ${tipoDocumento}`, err);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private async manejarDescargaPdf(blob: Blob, nombreArchivoBase: string): Promise<void> {
    if (!blob || blob.size === 0) {
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await this.guardarPdfEnDispositivo(blob, nombreArchivoBase);
      return;
    }

    const fileURL = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = fileURL;
    anchor.download = `${nombreArchivoBase}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(fileURL);
  }

  private async guardarPdfEnDispositivo(blob: Blob, nombreArchivoBase: string): Promise<void> {
    try {
      const base64Data = await this.blobToBase64(blob);
      const fileName = `${nombreArchivoBase}-${Date.now()}.pdf`;

      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });
    } catch (error) {
      console.error('Error al guardar PDF en dispositivo', error);
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo convertir el archivo'));
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result?.includes(',') ? result.split(',')[1] : '';
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }

  private async abrirUrlExterna(url: string): Promise<void> {
    if (!url) return;

    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }

    window.open(url, '_blank');
  }
}
