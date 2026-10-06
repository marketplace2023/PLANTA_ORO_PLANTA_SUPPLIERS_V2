# Portal de Proveedores · Ecosistema FUR

Entorno donde cada **proveedor** gestiona su empresa y lo que vende en el marketplace. Mismo layout y diseño que el panel de
planta y el de administración (navy + gold, `docs/design.md`).

Los productos del marketplace son **del proveedor**: no dependen de los modelos del catálogo que crea el administrador.
La «categoría» de un producto es solo la familia de equipos, para que los compradores lo encuentren.

## Pantallas

| Sección | Qué hace |
|---|---|
| Resumen | Productos por estado, cotizaciones por responder, calificación, verificación, avance del perfil |
| Mis productos | Crear, editar, **subir foto**, publicar, archivar y reactivar productos; precio vacío = «a cotizar» |
| Cotizaciones | Solicitudes de las plantas a las que te invitaron: cotizar, actualizar o retirar la cotización |
| Perfil | Datos de la empresa, **logo**, certificaciones y cobertura (etapas y familias). Razón social, NIF, país, estado, verificación y calificación los fija el administrador |
| Equipo | El responsable agrega o quita personas de la empresa |

- Una persona puede gestionar **varias empresas** (selector en la barra lateral).
- Sin empresa, el portal ofrece **registrarla**: queda *pendiente* hasta que el administrador la apruebe. Mientras tanto puede completar el perfil y subir el logo, pero no publicar productos.
- Una empresa *suspendida* no se puede editar.

## Registro y acceso

Hay **una sola cuenta para todos los portales**: se crea desde «Crea una» en el login (nombre, apellido, correo y contraseña de al menos 10 caracteres) y esa misma credencial entra a los demás portales. Crear la cuenta no da acceso a nada por sí sola: el portal ofrece **registrar la empresa proveedora**, que queda *pendiente* hasta que el administrador la apruebe (Administración → Proveedores y contratistas). Mientras la solicitud esté pendiente se puede preparar el perfil, pero no operar. La política de seguridad definitiva está por analizar.

## Fotos

Producto y logo se suben como archivo (PNG, JPG o WebP, hasta 5 MB). El servidor valida el **contenido real** del archivo (SVG y
HTML se rechazan a propósito) y las sirve públicas en `GET /marketplace/listings/:id/image` y `GET /providers/:id/logo`.
Poner una URL externa (desde la web original) reemplaza la foto subida.

## Ejecutar

```bash
# En ../planta_beneficio_oro
npm run db:local        # Postgres local
npm run dev:api         # API en :3000

# En esta carpeta
npm install
npm run dev             # http://localhost:5177
```

En desarrollo, Vite reenvía `/api` a `http://localhost:3000` (ver `vite.config.ts`): no hay que configurar CORS.
En producción define `VITE_API_URL` con la URL absoluta de la API.

Usuario de demo: `proveedor@fur.local` / `fur-local-2026` (responsable de *Repuestos Andinos S.A.C.*).

Verificación: `npm run lint && npm test && npm run build`.
