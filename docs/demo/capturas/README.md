# Capturas falsas para `/me-estafaron`

| Archivo | Qué muestra |
|---|---|
| `chat.png` | Chat de WhatsApp: "hola ma, soy Juli, cambié de número" → pide $180.000 a `juli.martinez.mp` / CVU `0000003100123456789016` desde `+54 9 11 4444-5555` |
| `comprobante.png` | Transferencia de $180.000 al mismo alias y CVU, de "Banco Ombú" (inventado, sin marcas reales) |

Las tres piezas (alias, CVU y teléfono) están en el cluster de `juli.martinez.mp` del seed, así que `/me-estafaron` las tiene que mostrar con reportes. El CVU tiene dígitos verificadores válidos.

Para regenerar los PNG (420×880 a 2x) después de editar el HTML:

```bash
chrome --headless=new --hide-scrollbars --force-device-scale-factor=2 --window-size=420,880 \
  --screenshot=chat.png file:///<ruta absoluta>/chat.html
```
