# Módulo de Asistencia — Proyecto organizado

Cambios realizados:

- Se añadió una vista de "Resumen Inicial" (Dashboard) con estadísticas clave: porcentaje de asistencia, estudiantes con más inasistencias y próximos eventos.
- Se agregó un módulo de notificaciones simuladas (`src/notifications.js`) que muestra toasts y registra logs en `localStorage`.
- Se agregó un módulo de mensajería interna simple (`src/messaging.js`) con UI modal que guarda mensajes en `localStorage`.
- Se agregó un módulo de export (`src/export.js`) con funciones para exportar a PDF (usando jsPDF CDN) y Excel/XLSX (usando SheetJS CDN).
- Se reorganizó la carga de scripts en `index.html` y se dejaron los nuevos módulos en `src/`.
- Se actualizaron `script.js` para incluir la nueva vista "resumen" y llamar a `initDashboard`.

Cómo usar (local, en navegador):

1. Abrir `index.html` en el navegador.
2. Seleccionar un rol (ej. Preceptor o Admin). Verás la vista "Resumen Inicial".
3. En el dashboard puedes:
   - Ver el % de asistencia calculado a partir de `localStorage.attendanceData` (se usa la estructura existente de `script.js`).
   - Exportar un reporte a PDF (usa jsPDF CDN) o Excel (SheetJS CDN).
   - Enviar notificaciones simuladas o abrir la mensajería interna.

Notas y limitaciones:

- Las notificaciones y la mensajería son simuladas y funcionan en el cliente usando `localStorage`.
- Para generación de PDF y Excel se usan librerías desde CDN incluidas en `index.html`. Si trabajas sin conexión estas funciones no estarán disponibles.
- Integración real con Supabase o servicios de push requiere: claves, configuración backend y permisos. Aquí sólo se incluyen implementaciones de cliente (mock) mínimas para prototipado.

Siguientes mejoras recomendadas:

- Integrar con la API real (Supabase) para persistencia centralizada.
- Añadir autenticación y permisos reales.
- Implementar notificaciones push reales (VAPID + servicio) y envío de correos/SMS.
- Añadir tests y bundler (Vite/Parcel) para estructurar `src/` como módulo.

---
Generado: cambios iniciales para organizar y extender funcionalidades del proyecto.
