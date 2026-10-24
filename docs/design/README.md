# Mula: tres pantallas, un sistema

Prototipo navegable diseñado con **Hallmark v2.0.0**, dirección propia de WhatsApp, verde y lima. Código independiente de `web/`, sin conexiones a Clerk, Supabase, WhatsApp o modelos.

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory docs/design
```

- Landing: `http://127.0.0.1:4173/#inicio`
- Dashboard familiar: `http://127.0.0.1:4173/#familia`
- Dashboard administrador: `http://127.0.0.1:4173/#admin`

La barra inferior cambia de pantalla. También se puede entrar desde los CTA de la landing. Abrir mediante HTTP: los módulos de JavaScript no funcionan abriendo directamente el archivo con `file://`.

## Dirección

Epilogue para titulares e interfaz, una landing lima, verde profundo en la aplicación y conversaciones con la UI de WhatsApp. El verde representa protección y selección; el rojo identifica riesgo, una adaptación semántica al contrato de Mula. Los estados se comunican también con texto e iconos. Sin fotografías de personas inventadas, testimonios, métricas de adopción ni efectos de scroll.

Los tokens viven en `tokens.css`. `base.css` proviene del scaffold de Hallmark. `styles.css` contiene las composiciones responsive; `screens.mjs` contiene las tres vistas, `app.mjs` la interacción; `model.mjs`, la muestra y sus consultas.

## Qué se puede probar

En familia: ver la alerta, marcarla como revisada durante la sesión de la demo, consultar contactos, editar nombre y teléfono con validación y consultar las entidades de la muestra. Probar mensaje alterna los tres guiones precalculados actuales. Me estafaron muestra el flujo de capturas y un caso de ejemplo; no recibe archivos ni redacta una denuncia real.

En administración: seleccionar los seis tipos de entidad en el grafo o en su lista accesible, buscar por valor, combinar provincia y período, ver reportes y distribución territorial y exportar el conjunto filtrado como CSV. Los filtros viven en la URL. La muestra incluye 30 reportes ilustrativos; 23 se vinculan al alias de la demo en cinco provincias. Los otros valores no son datos de producción.

Las ediciones y las marcas de revisión viven solo en memoria. Al recargar vuelven al estado inicial. La landing tiene una versión de texto si no carga JavaScript. Las fuentes se cargan desde Google Fonts con fallback local.

## Llevarlo a la aplicación

Aplicar las composiciones dentro de las rutas existentes `/`, `/app` y `/admin`. Sustituir la muestra por los datos que ya reciben esas páginas, conservando los controles de sesión y permisos vigentes en cada ruta, service role server-side, filtrado por owner y polling autenticado. No copiar las credenciales ni implementar auth desde el prototipo.

La landing usa una conversación ilustrativa del flujo existente. El slot `hero` permite reemplazarla por una captura de la intervención final si cambia la interfaz. No faltan fotografías ni materiales para ver estas tres propuestas completas.

Referencias: [Hallmark](https://github.com/nutlope/hallmark) y [recursos de Viajecito](https://gist.github.com/viajecito/5fd9898dadcb051b27a2c8fddde13559). Del segundo se tomó el proceso de composición, producto visible, adaptación mobile y verificación; no código de recursos comerciales.

## Verificación

`npm run check design` ejecuta las pruebas del modelo y la comprobación de sintaxis. La validación visual se ejecuta con el renderizador de Hallmark a 375, 1280, 1440 y 1920 px. Los resultados de la entrega están en `VERIFICATION.md`.
