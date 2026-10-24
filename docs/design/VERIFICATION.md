# Verificación del prototipo

24 de octubre de 2026. Dirección final: WhatsApp, verde y lima, según la corrección del usuario. Alcance: `docs/design/`; no modifica las rutas de producción de `web/`.

- `npm run check`: verde. Siete pruebas del modelo y comprobación de sintaxis de `app.mjs` y `screens.mjs`.
- TDD: las pruebas se ejecutaron primero en rojo por exports inexistentes y luego en verde con la implementación.
- Hallmark, landing, `sloplint --render --url http://127.0.0.1:4173/`: **0 FAIL, 0 REFLEX, 4 WARN**.
- Hallmark, aplicación, `sloplint --scope app --render` para `#familia` y `#admin`: **0 FAIL, 0 REFLEX, 2 WARN**.
- Render a 375, 1280, 1440 y 1920 px. Capturas de entrega a 1440×900 y 390×844 en `previews/`.
- Prototipo abierto y recargado en el navegador de la conversación.

Los avisos F4 y F7 corresponden a selecciones, avatares y burbujas de la UI de WhatsApp. Se conservan por el pedido de mostrar conversaciones reconocibles. F15 corresponde a las distintas densidades de landing y paneles en una hoja compartida. El aviso 77 señala las cuatro secciones de la landing: se conserva la versión corta solicitada por el usuario.

Las pruebas cubren los vínculos de las entidades, conteos del alias de demo, búsqueda, combinación de filtros, ausencia de resultados, validación de nombre y teléfono, CSV y los tres guiones de la demo. No se ejecutaron análisis reales ni se enviaron mensajes de WhatsApp. El flujo de capturas es una vista de ejemplo; el backend y la autenticación pertenecen a la aplicación actual.

Para integrar: reemplazar datos de muestra por los datos autenticados de cada ruta y comprobar el flujo completo dentro de `web/`. Los permisos deben seguir los helpers vigentes de la aplicación, que pueden cambiar independientemente de este prototipo.
