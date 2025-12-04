# ProyectoESP32 Backend

Este backend recibe datos del ESP32 y expone rutas para consultar y guardar la telemetría.

## Endpoints

- `POST /api/datos`: Guarda una lectura con `{ temp, hum, timestamp }`.
- `GET /api/datos`: Lista lecturas ordenadas por fecha descendente.
- `GET /api/datos/count`: Devuelve el conteo total de lecturas.
- `GET /api/update`: Devuelve un intervalo aleatorio entre 4 y 60 segundos.

### `GET /api/update`
Respuesta de ejemplo:
```json
{ "intervalSeconds": 17 }
```
Uso sugerido en el ESP32: consumir periódicamente este endpoint y usar el valor para determinar cada cuánto enviar los datos y cuándo volver a consultar el nuevo intervalo.

## Ejecutar
1. Configura `MONGODB_URI` en `.env`.
2. Instala dependencias.
3. Inicia el servidor.

```powershell
npm install
$env:MONGODB_URI = "mongodb://localhost:27017/tu_db"; npm start
```

Luego prueba:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/update" -Method Get
```