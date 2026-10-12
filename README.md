# Cuaderno de campo – Olivares Villairenses

Aplicación web instalable en el móvil (PWA) para controlar las labores, los productos, el stock y la cosecha de una finca de olivos en Villa Iris (Argentina).

**App desplegada:** https://control-olivos.lovable.app

## Problema que resuelve

La dueña no sabía de un vistazo qué se había hecho, en qué filas y qué faltaba por hacer. El encargado necesita anotar el trabajo del día con pocos toques desde el móvil, sin planillas ni papeles.

## Roles

- **Administradora:** panel de avance por tarea, productos, plazos de seguridad, stock, cosecha y rendimiento, configuración y usuarios.
- **Encargado (rol «campo»):** anotar el trabajo del día, guía de productos, calculadora de dosis, stock y alertas de plazos.

## La finca

- 5 hectáreas, 35 filas y 34 olivos por fila.
- Cada fila se divide en **zona A** (izquierda, 17 olivos) y **zona B** (derecha, 17 olivos).
- Hectáreas 1 a 3 productivas (filas 1 a 21).
- Hectáreas 4 y 5 jóvenes (filas 22 a 35).

## Funciones principales

- **Plan anual** adaptado al hemisferio sur, con tareas recurrentes por estación.
- **Registro de trabajo** por fecha, tarea, hectárea, fila y zona, con un historial que no se borra.
- **Panel de avance** por tarea con las filas hechas y las pendientes.
- **Guía de productos** y **calculadora de dosis**.
- **Plazos de seguridad** por fila, con alertas antes de aplicar productos o fertilizar.
- **Stock** con compras, avisos de faltante y descuento automático al aplicar.
- **Cosecha y rendimiento**: kilos de aceituna, litros de aceite y rendimiento calculado.
- **Invitación de usuarios** por parte de la administradora.
- **PWA**: se instala en el teléfono y se abre a pantalla completa.

## Stack

- TanStack Start y TanStack Router
- React 19 y TypeScript
- Tailwind CSS 4 y shadcn/ui
- Lovable Cloud (PostgreSQL, autenticación y políticas RLS)
- Vitest

## Estructura del proyecto

```text
src/routes/          Páginas de la aplicación
src/components/      Componentes de interfaz
src/lib/logic.ts     Cálculos de dosis, fechas y plazos
src/lib/store.tsx    Estado y sincronización con la base de datos
drizzle/migrations/  Esquema de la base de datos
```

## Seguridad

- No hay registro público: solo pueden crear cuenta el email de la administradora y los emails invitados.
- Políticas RLS activas en todas las tablas.
- La tabla de registros de trabajo no admite edición ni borrado.

## Cuentas de prueba

Las cuentas de prueba para el jurado están en la documentación técnica del hackathon.

## Desarrollo local

```sh
npm i
npm run dev     # servidor de desarrollo
npm run build   # compilación de producción
npm test        # pruebas
```

---

Proyecto desarrollado íntegramente con Lovable para el Hackathon de Vibe Coding del Máster en Inteligencia Artificial de Big School (Edición 7).
