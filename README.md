# Funcionalidad: Eventos

Esta sección documenta la funcionalidad de "Eventos" incluida en la aplicación móvil (GAD Ibarra). Contiene descripción, archivos relevantes, cómo consumir el servicio de eventos y notas de integración para desarrolladores.

## Resumen

- Propósito: listar, filtrar y mostrar detalles de eventos (ferias, capacitaciones, etc.).
- UX principal: vista tipo listado (`eventos/home`) con selector mes/año, refresher (pull-to-refresh), paginación por carga incremental (infinite scroll) y detalle en modal. Las imágenes se muestran en una galería modal.

## Rutas

- `/eventos/home` → `src/app/eventos/home/home.page` (lista de eventos, filtros, selector de mes)
- `/eventos/evento` → `src/app/eventos/evento/evento.page` (modal/ventana de detalle del evento)

Estas rutas están registradas en `src/app/app.routes.ts`.

## Archivos clave

- Modelo: `src/app/eventos/evento.model.ts` — interfaz `Evento` (campos esperados del API y campos opcionales locales).
- Servicio: `src/app/eventos/eventos.service.ts` — manejo de datos de eventos (datos ficticios, carga desde API, listado).
- Home (lista): `src/app/eventos/home/home.page.{ts,html,scss}` — UI principal, filtros y paginación.
- Detalle (modal): `src/app/eventos/evento/evento.page.{ts,html,scss}` — muestra información completa y acciones (abrir ubicación, abrir link, galería).
- Galería modal: `src/app/shared/gallery-modal/gallery-modal.component.{ts,html,scss}` — visor/carousel de imágenes (usa `gallery-half-modal` cssClass).
- Estilos globales: `src/global.scss` — variables y clases utilitarias (`--header-red-bg`, `.header-red`, `.evento-header`) para que los headers y modales compartan diseño.

## Modelo (`Evento`) — campos relevantes

- `id`: number
- `name`: string
- `mainBanner?`: string (URL)
- `images?`: { name: string; url: string }[]
- `dateStart`: string (ISO)
- `dateEnd`: string (ISO)
- `description?`, `direction?`, `location?`, `contact?`, `services?`, `link?`, `state?`
- Campos opcionales internos: `inicioPromocion`, `finPromocion`, `prioridad`, `organizadores`.

## Servicio (`EventosService`) — comportamiento

- Inicializa con datos ficticios (método `crearDatosFicticios`) para desarrollo y pruebas.
- `cargarDesdeApi(json)` — permite pasar un objeto JSON con `{ success, message?, data: Evento[] }` y asigna `data` internamente.
- `cargarDesdeApiUrl()` — construye `environment.apiUrl + '/events'`, hace `GET` y, si la respuesta es válida, actualiza la lista interna de `eventos`.
- `listarEventos()` — devuelve una copia del arreglo actual de eventos.

Notas:
- `cargarDesdeApiUrl()` devuelve `Evento[] | null` (null en caso de error). El uso de la API está controlado en `home.page.ts` mediante un flag (`useApiEvents`) para facilitar pruebas locales.

## Home (comportamiento de `home.page`)

- Carga inicial (`cargarInicial`) intenta (opcional) usar la API; si no, usa los datos del servicio.
- Calcula y muestra eventos en promoción activa (filtrado por `inicioPromocion`/`finPromocion`).
- Paginación: muestra inicialmente `INICIAL_COUNT` (3) y carga más bloques de `BATCH_SIZE` (5) con `ion-infinite-scroll` y `mostrarNuevos()`.
- Pull-to-refresh: `mostrarAnteriores()` recarga la fuente y hace scroll al tope.
- Selector Mes/Año: `mesSeleccionado` permite filtrar eventos que ocurren (parcialmente o totalmente) en el mes elegido. `generarMesesConEventos()` construye las opciones del selector.
- Acciones UI:
	- `abrirDetalles(evento)` → abre `EventoPage` como modal con el objeto `evento`.
	- `abrirGaleria(evento)` → abre `GalleryModalComponent` como modal (cssClass `gallery-half-modal`) con las imágenes del evento.

## Detalle de evento (`EventoPage`)

- Propósito: mostrar la información completa del evento y permitir acciones rápidas.
- Funciones útiles:
	- `dismiss()` → cierra el modal.
	- `abrirUbicacion(address)` → abre Google Maps en nueva pestaña con la dirección codificada.
	- `accederEvento(link)` → abre el `link` del evento en nueva pestaña.
	- `abrirImagen(src)` → abre la galería modal empezando en la imagen seleccionada.
	- `getContactIcon(type)` y utilidades de formato (`formatPhoneDigits`, `whatsappUrl`, `mailtoUrl`) para mostrar correctamente íconos y enlaces de contacto.

## Galería (`GalleryModalComponent`)

- Presenta un carousel de imágenes con navegación y soporte de zoom ( doble click ).
- Se abre como modal con `cssClass: 'gallery-half-modal'` — en `global.scss` hay estilos que ajustan altura y comportamiento del modal.
- Para que el header de la galería herede el estilo rojo/blanco se utilizan las clases `header-red` y `evento-header` en el `ion-header` y `ion-toolbar`. El proyecto ya incluye `ion-toolbar.header-red { --background: var(--header-red-bg); color: var(--header-red-text) }`.

## Integración con API (ejemplo)

- Se espera que el endpoint `/events` devuelva JSON con la forma:

```json
{
	"success": true,
	"data": [ /* array de objetos Evento conforme al modelo */ ]
}
```

- Para activar la carga desde API en `home.page.ts` cambiar `useApiEvents` a `true` (y configurar `environment.apiUrl`).

## Notas de estilo y problemas comunes

- Si el `ion-header` usa `translucent`, Ionic aplica efectos de fondo. Para forzar un fondo sólido rojo se establece `--background: var(--header-red-bg)` en `global.scss` o se quita `translucent` del `ion-header`.
- Clases útiles: `.header-red`, `.evento-header`, `gallery-half-modal`.

## Ejemplos rápidos (dev)

- Listar eventos en consola:

```ts
import { EventosService } from './eventos/eventos.service';

constructor(private eventosSrv: EventosService) {}

ngOnInit() {
	console.log(this.eventosSrv.listarEventos());
}
```

- Abrir modal de detalles (programático):

```ts
const { EventoPage } = await import('./eventos/evento/evento.page');
const modal = await this.modalCtrl.create({ component: EventoPage, componentProps: { evento } });
await modal.present();
```

---

Si quieres, puedo ampliar esta sección con diagramas de flujo, ejemplos de payloads reales, o una guía para desplegar la integración con el backend (ej. headers, autenticación). ¿Qué prefieres que añada? 

