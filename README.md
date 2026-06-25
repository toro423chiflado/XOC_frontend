# TXDXAI React

Frontend de XOC para monitoreo, visualizacion y operacion de integraciones de ciberseguridad en un entorno multi-tenant.

## Acceso

- App: [https://xoc-frontend.firebaseapp.com/dashboard](https://xoc-frontend.firebaseapp.com/dashboard)

## Funcionalidades principales

- Login con JWT usando `email` y `password`
- Onboarding multi-tenant mediante `POST /api/onboarding/tenant`
- Dashboard por proveedor para OpenVAS, Nessus, InsightVM, Wazuh, Zabbix y Uptime
- Panel de superadmin para companias, usuarios, integraciones, tickets y sesiones
- Visualizacion de metricas, hallazgos, alertas y estado operativo

## Stack

- React
- TypeScript
- Vite
- Axios
- Tailwind CSS
- Recharts

## Desarrollo local

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar entorno de desarrollo:

```bash
npm run dev
```

3. Generar build de produccion:

```bash
npm run build
```

## Configuracion

La aplicacion usa `VITE_API_URL` para apuntar al backend desplegado en API Gateway.

Ejemplo:

```env
VITE_API_URL=https://793icknvx8.execute-api.us-east-1.amazonaws.com/
```

## Notas

- El frontend no configura CORS; eso se resuelve del lado del backend/API Gateway.
- El build final embebe las variables `VITE_*`, por lo que cualquier cambio en la URL del backend requiere reconstruir la aplicacion.
