# Future Landing Page

Una página de aterrizaje de producción para Future, con arquitectura de conversión optimizada, widget de WhatsApp, y backend Express seguro.

## Características

- **Diseño Responsivo**: Mobile-first con breakpoints en 480px, 768px, 1024px.
- **Tema Future**: Paleta oscura (#1B1D20, #F5F7FA, #2A2D31, #E62E2E), tipografía Montserrat, motivos sutiles.
- **Animaciones**: Fade-in/slide-up con IntersectionObserver, micro-interacciones.
- **Widget WhatsApp**: Panel deslizable con sesión efímera, integración con n8n.
- **Backend Seguro**: Express con helmet, CORS, rate-limiting, validación.
- **SEO y A11y**: Meta tags, JSON-LD, contraste AA, navegación por teclado.
- **Docker**: Compatible con EasyPanel.

## Estructura del Proyecto

```
.
├── index.html          # Página principal
├── src/
│   ├── app.js          # JavaScript del frontend
│   └── styles.css      # Estilos CSS
├── server.js           # Backend Express
├── public/
│   └── assets/
│       ├── logo.svg
│       ├── favicon.ico
│       └── casos/
│           ├── mrs-muzzarella.png
│           └── estetica-gala.png
├── .env.example        # Variables de entorno
├── Dockerfile          # Configuración Docker
└── README.md           # Este archivo
```

## Instalación y Desarrollo Local

1. Clona el repositorio:
   ```bash
   git clone <repository-url>
   cd future-landing
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Copia el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

4. Edita `.env` con tus valores reales.

5. Ejecuta en desarrollo:
   ```bash
   npm start
   ```

   O para desarrollo con recarga:
   ```bash
   npm run dev
   ```

## Despliegue con Docker

### Construcción Local

```bash
docker build -t future-landing .
docker run -p 8080:8080 --env-file .env future-landing
```

### Despliegue en EasyPanel

1. **Sube el código**: Comprime el proyecto (incluyendo Dockerfile) en un ZIP o sube a un repositorio Git.

2. **Configura en EasyPanel**:
   - Selecciona "Build from Dockerfile".
   - Establece las variables de entorno en la sección de Environment Variables:
     - `PORT`: 8080
     - `NODE_ENV`: production
     - `WEBHOOK_URL`: https://tu-webhook-n8n
     - `ALLOWED_ORIGIN`: https://tudominio.com
     - `WA_NUMBER`: 5493704XXXXXX
     - `YOUTUBE_ID`: dQw4w9WgXcQ
   - Configura el dominio y SSL.

3. **Health Check**: EasyPanel usará `/health` para verificar el estado.

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | 8080 |
| `NODE_ENV` | Entorno | production |
| `WEBHOOK_URL` | URL del webhook de n8n | https://tu-n8n-webhook |
| `ALLOWED_ORIGIN` | Origen permitido para CORS | https://tudominio.com |
| `WA_NUMBER` | Número de WhatsApp (sin +) | 5493704XXXXXX |
| `YOUTUBE_ID` | ID del video de YouTube | dQw4w9WgXcQ |

## Personalización

### Reemplazos Requeridos

- **Logo**: Reemplaza `public/assets/logo.svg` con tu logo.
- **Favicon**: Reemplaza `public/favicon.ico` con tu favicon.
- **Imágenes de Casos**: Reemplaza `public/assets/casos/*.png` con las imágenes reales.
- **Video de YouTube**: Cambia `data-youtube-id` en `index.html` línea ~70.
- **Contenido**: Edita textos en `index.html` para tu contenido real (mantén en español).

### Videos de Casos de Éxito

Agrega videos MP4 en `public/assets/casos/` y actualiza las fuentes en `index.html`.

## Scripts NPM

- `npm start`: Inicia el servidor en producción.
- `npm run dev`: Inicia con nodemon para desarrollo.

## Dependencias

- **express**: Framework web.
- **helmet**: Seguridad HTTP.
- **cors**: Cross-Origin Resource Sharing.
- **express-rate-limit**: Limitación de tasa.
- **dotenv**: Variables de entorno.

## Seguridad

- Rate limiting: 60 solicitudes/minuto por IP.
- Validación y sanitización de entradas.
- Headers de seguridad con Helmet.
- CORS restringido al origen permitido.
- No logging de datos sensibles.

## Rendimiento

- Imágenes con `loading="lazy"`.
- Fuentes con `font-display: swap`.
- CSS y JS minificados (considera herramientas adicionales para producción).
- Objetivo Lighthouse: ≥90 en Performance y A11y.

## Soporte

Para soporte, contacta al equipo de desarrollo o abre un issue en el repositorio.