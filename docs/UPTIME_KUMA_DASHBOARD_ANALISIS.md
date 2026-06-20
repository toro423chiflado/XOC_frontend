# Documentacion del dashboard de Uptime Kuma

Este documento describe como esta implementado hoy el dashboard web de `Uptime Kuma` dentro del proyecto, como consume la data, como la transforma y que semantica visual usa.

La idea es que este archivo sirva como handoff tecnico para otra sesion de IA o para adaptar el dashboard a la app movil sin tener que volver a explorar todo el repo.

## 1. Ruta y entrypoint

- Vista principal: `/dashboard/uptime`
- Router: `src/routes/AppRoutes.tsx`
- Selector por provider: `src/features/dashboard/provider/ProviderDashboard.tsx`
- Componente principal: `src/features/dashboard/provider/uptime/UptimeDashboard.tsx`

## 2. Archivos involucrados

- `src/features/dashboard/provider/uptime/UptimeDashboard.tsx`
- `src/features/dashboard/provider/uptime/UptimeHero.tsx`
- `src/features/dashboard/provider/uptime/UptimeKpiGrid.tsx`
- `src/features/dashboard/provider/uptime/UptimeChartsSection.tsx`
- `src/features/dashboard/provider/uptime/UptimeOperationsSection.tsx`
- `src/features/dashboard/provider/uptime/utils.ts`
- `src/features/dashboard/provider/uptime/types.ts`
- `src/services/provider.service.ts`
- `src/services/provider-api.service.ts`

## 3. Flujo general

El flujo actual es este:

1. `UptimeDashboard.tsx` monta la vista.
2. El componente mantiene el rango activo con `rangePreset`, `customFrom`, `customTo`.
3. Cuando cambia el rango, llama a `providerService.getUptimeMetrics(...)`.
4. `providerService` delega en `providerApiService.getUptimeMetrics(...)`.
5. `provider-api.service.ts` consume los endpoints reales del backend.
6. Esa respuesta se normaliza a un objeto `UptimeMetrics`.
7. `buildUptimeDashboardModel(...)` convierte `UptimeMetrics` en un modelo visual para UI.
8. Ese modelo alimenta hero, KPI grid, charts y bloques operativos.

## 4. Endpoints consumidos

La implementacion actual usa estos endpoints:

### 4.1 Lista de scans

Archivo: `src/services/provider-api.service.ts`

```ts
api.get('/api/scans', {
  params: {
    scanner_type: 'uptime_kuma',
    limit: 200,
    ...rangeParams
  }
})
```

Uso:

- obtener historico de scans de Uptime Kuma dentro del rango
- construir tendencia
- obtener ultimo scan
- construir cortes recientes
- recuperar metadata del ultimo snapshot

### 4.2 Summary de integracion

```ts
api.get('/api/integrations/uptime_kuma/summary', { params: rangeParams })
```

Uso:

- fallback de conteos agregados
- `summary.services.up`
- `summary.services.down`
- `summary.total_services`
- `recent_downtime`
- `uptime_percentage`

### 4.3 Findings del ultimo scan

```ts
providerApiService.getScanFindings(latestScanId, { domain: 'noc' })
```

Uso:

- fallback para construir incidentes recientes si el summary no trae `recent_downtime`

## 5. Tipo base que usa el dashboard

Archivo: `src/services/provider.service.ts`

```ts
export interface UptimeMetrics {
  servicesMonitored: number;
  servicesUp: number;
  servicesDown: number;
  uptimePercentage: number;
  recentDowntime: Array<{ service: string; duration: string; timestamp: string }>;
  scanDetails?: Array<{
    id: string;
    target: string;
    status: 'completed' | 'failed' | 'running';
    scanner_type: string;
    created_at: string;
    monitored?: number;
    up?: number;
    down?: number;
    uptime?: number;
  }>;
  trend7Days?: Array<{ date: string; uptime: number; down: number }>;
  downMonitors?: string[];
  avgResponseTimeMs?: number;
  avgResponseTimeMs30d?: number;
  avgResponseTimeMs365d?: number;
  avgUptimeRatio1d?: number;
  avgUptimeRatio30d?: number;
  avgUptimeRatio365d?: number;
  lastSync?: string;
}
```

## 6. Como se construyen los datos

Archivo: `src/services/provider-api.service.ts`, funcion `getUptimeMetrics`

### 6.1 Conteo de servicios monitoreados

Se intenta sacar de varias fuentes, en este orden:

- `latestScan.total_hosts`
- `latestScan.services_total`
- `latestScan.services.total`
- `latestScan.results.total`
- `latestScan.results.services_total`
- `latestScan.results.monitored`
- `latestScan.metrics.total`
- `summary.services.total`
- `summary.services.monitored`
- `summary.total_services`
- `summary.services_total`

### 6.2 Conteo de servicios caidos

Se intenta sacar de:

- `meta.down_count`
- `scan.down_count`
- `scan.services.down`
- `scan.results.down`
- `scan.metrics.down`
- `summary.services.down`

Si sigue en `0`, usa fallback con:

- `latestScan.critical_count`
- largo de `meta_info.down_monitors`

Nota importante:

- en esta integracion, `critical_count` se interpreta como monitores `DOWN`
- no significa severidad CVSS

### 6.3 Conteo de servicios operativos

Se intenta sacar de:

- `meta.up_count`
- `scan.up_count`
- `scan.services.up`
- `scan.results.up`
- `scan.metrics.up`
- `summary.services.up`

Si no existe:

1. deriva `up = monitored - down`
2. si aun no sirve, usa `low_count` o `info_count`

### 6.4 Uptime percentage

Se intenta sacar de:

- `meta.avg_uptime_ratio_1d`
- `scan.meta_info.avg_uptime_ratio_1d`
- `scan.uptime_percentage`
- `scan.uptime`
- `scan.results.uptime_percentage`
- `scan.results.uptime`
- `scan.metrics.uptime`
- `summary.uptime_percentage`
- `summary.uptimePercentage`

Si queda en `0` pero hay `servicesMonitored` y `servicesUp`, se calcula asi:

```ts
uptime = (servicesUp / servicesMonitored) * 100
```

### 6.5 Monitores caidos actuales

Se toman de:

```ts
latestMeta.down_monitors
```

Se filtran solo strings no vacios.

Este arreglo es clave para el dashboard actual porque alimenta:

- monitores actualmente afectados
- lista de incidentes fallback
- agrupacion por categoria y sitio

### 6.6 Incidentes recientes

Se construyen asi:

1. si `summary.recent_downtime` existe, se usa primero
2. si no, se intenta mapear desde findings del ultimo scan
3. adicionalmente, si hay `down_monitors`, se crea un fallback visual con:
   - `service = nombre del monitor`
   - `duration = "Estado DOWN activo"`
   - `timestamp = lastSync`

### 6.7 Tendencia historica

Se usa:

```ts
const trend7Days = buildUptimeTrendFromScans(mergedScans)
```

Luego en `utils.ts` se convierte en `trendData` diario para el rango visible.

Regla importante:

- si faltan dias sin scan real, se conserva `lastKnownUptime`
- para dias sin corte se pone `down = 0`
- por eso la grafica puede verse como picos aislados de servicios caidos

### 6.8 Cortes recientes

`scanDetails` se construye recorriendo `mergedScans` y mapeando:

- `id`
- `target`
- `status`
- `created_at`
- `monitored`
- `up`
- `down`
- `uptime`

Ese arreglo luego alimenta `scanRows` en el modelo visual.

## 7. Modelo visual final

Archivo: `src/features/dashboard/provider/uptime/types.ts`

El dashboard no renderiza directo desde `UptimeMetrics`. Primero genera un `UptimeDashboardModel`.

Los campos visuales principales son:

- `servicesMonitored`
- `servicesUp`
- `servicesDown`
- `uptimePercentage`
- `availabilityPressure`
- `healthState`
- `distribution`
- `trendData`
- `summaryCards`
- `affectedMonitors`
- `impactByCategory`
- `impactBySite`
- `recentIncidents`
- `scanRows`
- `dataFreshnessLabel`
- `historyRangeLabel`

## 8. Reglas visuales y semanticas

Archivo: `src/features/dashboard/provider/uptime/utils.ts`

### 8.1 Health state

El estado de salud actual se calcula asi:

- `Sin datos` si `monitored === 0`
- `Critico` si `down >= 5` o `uptime < 97`
- `En riesgo` si `down > 0` o `uptime < 99.5`
- `Saludable` en el resto

### 8.2 Availability pressure

```ts
availabilityPressure = (down / monitored) * 100
```

Se usa como porcentaje del inventario afectado.

### 8.3 Distribution

Se construye con tres estados:

- `up`
- `down`
- `other`

`other` significa servicios sin estado claro, calculado como:

```ts
other = monitored - up - down
```

### 8.4 Trend label

- `Serie historica real del periodo` si hay suficiente match de cortes
- `Historial parcial del periodo` si no

### 8.5 Enriquecimiento de monitores afectados

El dashboard infiere metadata visual desde el nombre del monitor.

#### Categoria inferida

Funcion: `inferMonitorCategory`

Reglas:

- contiene `olt` -> `OLT`
- contiene `ccr`, `mikrotik`, `router` -> `Router`
- contiene `loopback` -> `Loopback`
- contiene `ip mgmt` o `management` -> `Gestion`
- contiene `ip enlace` o `enlace` -> `Enlace`
- fallback -> `Monitor`

#### Sitio inferido

Funcion: `inferMonitorSite`

Hace parsing del nombre buscando patrones como:

- `OLT X - algo`
- `CCR2216 X - algo`
- `Mikrotik X - algo`

Si no logra inferirlo:

- usa la cola del string despues de `-`
- si tampoco sirve: `Sitio no clasificado`

## 9. Estructura actual de la UI

## 9.1 `UptimeDashboard.tsx`

Responsabilidades:

- maneja loading y error
- decide si mostrar `AgentNotDeployed`
- maneja el selector de rango
- construye `model` con `buildUptimeDashboardModel`
- renderiza:
  - `UptimeHero`
  - `UptimeKpiGrid`
  - `UptimeChartsSection`
  - `UptimeOperationsSection`

### Estado vacio

Muestra `AgentNotDeployed` cuando:

- no hay servicios monitoreados
- no hay `up`
- no hay `down`
- no hay `uptimePercentage`
- no hay `recentDowntime`
- no hay `scanDetails`

## 9.2 `UptimeHero.tsx`

Semantica actual:

- bloque principal izquierdo:
  - `Disponibilidad actual`
  - numero grande: `model.uptimePercentage`
  - badge de estado: `model.healthState.label`
  - resumen corto: `model.healthState.summary`

- tarjeta lateral:
  - `Impacto actual`
  - servicio/monitor mas afectado: `model.mostCriticalService?.service`
  - texto: `x afectados de y monitoreados`
  - `Ultima sincronizacion`

- controles:
  - boton `Actualizar`
  - `ModernDateRangeSelector` incrustado dentro del hero como `rangeControl`

## 9.3 `UptimeKpiGrid.tsx`

Muestra 4 tarjetas KPI:

1. `Cobertura monitoreada`
2. `Disponibilidad actual`
3. `Monitores afectados`
4. `Presion operativa`

Cada card tiene:

- `title`
- `value`
- `subtitle`
- `accentClass`
- `glowClass`
- `iconKey`

Iconos usados:

- `monitors` -> `Server`
- `availability` -> `HeartPulse`
- `down` -> `AlertOctagon`
- `pressure` -> `Activity`

## 9.4 `UptimeChartsSection.tsx`

Tiene dos bloques.

### A. Presion de disponibilidad

No usa `recharts`.

Renderiza una lista de tarjetas por estado:

- `Operativos`
- `Caidos`
- `Sin estado`

Cada item muestra:

- valor absoluto
- porcentaje del inventario
- barra horizontal de participacion

### B. Tendencia historica

Usa `recharts`:

- `ResponsiveContainer`
- `ComposedChart`
- `CartesianGrid`
- `XAxis`
- `YAxis`
- `Tooltip`
- `Legend`
- `Area`

Serie actual:

- `down`

Semantica del chart:

- area roja
- nombre: `Servicios caidos`
- representa cuantos servicios estaban caidos por fecha del rango

Nota importante:

- actualmente este chart no dibuja linea de uptime
- la tendencia fuerte del dashboard esta centrada en caidas por corte
- el `uptime` historico existe en `trendData`, pero hoy no se pinta visualmente

## 9.5 `UptimeOperationsSection.tsx`

Tiene cuatro bloques operativos.

### A. Monitores actualmente afectados

Fuente:

- `model.affectedMonitors`

Cada tarjeta muestra:

- nombre del monitor
- categoria inferida
- sitio inferido
- severidad operativa
- texto `DOWN activo`
- fecha del ultimo corte visible

### B. Impacto agregado

Fuente:

- `model.impactByCategory`
- `model.impactBySite`

Uso:

- resumen ejecutivo rapido
- agrupacion por tipo de activo
- agrupacion por sitio

### C. Cortes recientes

Fuente:

- `model.scanRows`

Cada corte muestra:

- nombre del corte
- fecha/hora
- estado del scan
- uptime
- operativos
- caidos
- monitoreados

### D. Incidentes y contexto

Fuente:

- `model.recentIncidents`

Cada tarjeta muestra:

- servicio
- referencia/duracion
- timestamp

## 10. Selector temporal

Componente usado:

- `src/features/dashboard/provider/ModernDateRangeSelector.tsx`

Se usa dentro del hero.

Soporta:

- `today`
- `yesterday`
- `7d`
- `30d`
- `custom`

Comportamiento:

- valor por defecto actual en Uptime: `30d`
- si el rango es `custom`, exige `from` y `to`
- si `from > to`, muestra error

## 11. Estados de carga y error

En `UptimeDashboard.tsx` existen tres estados principales:

### Loading inicial

- spinner grande
- texto: `Sincronizando monitores de Uptime Kuma...`

### Error sin data previa

- pantalla de error completa
- boton `Reintentar`

### Error con data previa

- banner rojo arriba del dashboard
- conserva la vista previa cargada

## 12. Notas importantes para la version movil

Si esta implementacion se va a adaptar a mobile, estas son las reglas que conviene respetar.

### Mantener

1. Hero ejecutivo
2. KPI grid compacto
3. Tendencia historica
4. Lista de monitores afectados
5. Cortes recientes

### Cambiar a vertical/mobile

1. `Impacto agregado`
   - pasar a cards apiladas

2. `Monitores actualmente afectados`
   - usar cards scrollables verticales

3. `Cortes recientes`
   - mostrar solo 3 a 5 elementos en mobile

4. `Incidentes y contexto`
   - convertir en lista simple, sin grid de 2 columnas

### Semantica que no debe romperse

1. `critical_count` no debe presentarse como CVSS
2. `downMonitors` es la fuente principal de impacto actual
3. `trendData` de `down` es historico por corte, no una serie de latencia continua
4. si no hay suficiente historial, la vista debe dejar claro que el periodo es parcial

## 13. Que datos son realmente importantes para mobile

Para una version movil util, las piezas prioritarias son:

1. `uptimePercentage`
2. `servicesMonitored`
3. `servicesDown`
4. `healthState`
5. `affectedMonitors`
6. `impactByCategory`
7. `impactBySite`
8. `trendData`
9. `scanRows`
10. `dataFreshnessLabel`

## 14. Posibles diferencias con mobile

La app movil no necesariamente debe copiar el layout exacto web.

Lo importante es conservar la logica:

1. resumen ejecutivo arriba
2. tendencia historica visible
3. impacto actual en segundo plano de prioridad
4. soporte operativo abajo

Orden recomendado para mobile:

1. Hero
2. KPI cards
3. Tendencia historica
4. Monitores afectados
5. Impacto por categoria/sitio
6. Cortes recientes
7. Incidentes/contexto

## 15. Resumen ejecutivo de implementacion

Hoy el dashboard de Uptime Kuma en web esta implementado como un panel de disponibilidad NOC, no como un simple espejo crudo del backend.

Su valor esta en que:

1. unifica scans + summary + findings
2. deriva `up`, `down`, `uptime` y `impacto actual`
3. interpreta `down_monitors` como eje principal de operacion
4. enriquece los nombres de monitores con categoria y sitio inferido
5. separa claramente:
   - estado actual
   - tendencia historica
   - impacto operativo
   - cortes recientes

Si se adapta a mobile, no hace falta rediseñar la logica de negocio: ya existe una capa de modelo suficientemente clara en `buildUptimeDashboardModel(...)` para reusar casi toda la semantica actual.
