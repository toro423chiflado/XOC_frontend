## Documentacion del dashboard de Wazuh

Este documento describe que muestra hoy el dashboard de Wazuh, de donde sale cada dato y como se presenta visualmente en la UI.

## Rutas involucradas

- Vista principal: `/dashboard/wazuh`
- Vista detalle por corte: `/dashboard/wazuh/scan/:id`

Archivos principales:

- `src/features/dashboard/provider/ProviderDashboard.tsx`
- `src/features/dashboard/provider/wazuh/WazuhDashboard.tsx`
- `src/features/dashboard/provider/wazuh/WazuhHero.tsx`
- `src/features/dashboard/provider/wazuh/WazuhKpiGrid.tsx`
- `src/features/dashboard/provider/wazuh/WazuhChartsSection.tsx`
- `src/features/dashboard/provider/wazuh/WazuhOperationsSection.tsx`
- `src/features/dashboard/provider/wazuh/WazuhScanDetail.tsx`
- `src/features/dashboard/provider/wazuh/utils.ts`
- `src/services/provider.service.ts`

## Fuente de datos

La vista principal consulta `providerService.getWazuhMetrics(...)`.

El payload esperado es `WazuhMetrics` y contiene principalmente:

- `activeAgents`
- `inactiveAgents`
- `topRules[]`
- `alertsBySeverity.{critical, high, medium, low}`
- `configured`
- `status`
- `message`
- `hostsReported`
- `avgFindingsPerHost`
- `mostCriticalHost.{host, criticalCount}`
- `lastSync`
- `agentInfo.{name, lastUsed}`
- `trend7Days[]`
- `recentFindings[]`
- `scanDetails[]`
- `currentSnapshot.{scanId, scannedAt, totalAlerts, alertsBySeverity}`
- `historyRangeLabel`

La vista detalle consulta `providerService.getWazuhScanDetail(id)`.

## Estados de la vista principal

### 1. Loading

Muestra un spinner centrado (`Loader2`) mientras carga la informacion.

### 2. Error

Si falla la consulta, muestra:

- titulo: `Wazuh No Disponible`
- mensaje de error
- icono `WifiOff`
- boton `Reintentar`

### 3. Integracion no configurada o sin telemetria

Si `metrics.configured === false` o no hay datos historicos/snapshot/reglas/hallazgos/cortes, se renderiza `AgentNotDeployed` con mensaje como:

- `Wazuh integration not configured.`
- `No hay telemetria de Wazuh para el rango seleccionado.`

## Control de rango

La vista incluye `ModernDateRangeSelector` con estos presets:

- `today`
- `yesterday`
- `7d`
- `30d`
- `custom`

Como se muestra:

- boton superior con etiqueta del rango activo
- dropdown flotante oscuro con presets a la izquierda
- si el rango es `custom`, muestra dos inputs tipo fecha y boton `Aplicar Rango`
- footer visual con `Zona horaria: UTC-5`

Validaciones implementadas:

- no permite aplicar `custom` sin `from` y `to`
- no permite `from > to`

## Vista principal: que muestra

### 1. Hero superior

Componente: `WazuhHero.tsx`

Muestra:

- logo de Wazuh
- etiqueta `Detection Operations Center`
- titulo `Wazuh Detection Intelligence`
- subtitulo `Alertas, actividad y contexto operativo en una sola vista.`
- selector de rango
- boton `Actualizar`

Bloque principal del hero:

- si existe al menos una regla en `topRules`, muestra:
  - valor grande: `topRules[0].count`
  - etiqueta: `Principal Amenaza Activa`
  - subtitulo: `topRules[0].rule`
- si no existe `topRules[0]`, muestra:
  - valor grande: `currentSnapshot.totalAlerts`
  - etiqueta: `Resumen actual`
  - subtitulo: `alertas visibles`

Bloque lateral del hero:

- titulo: `Ultima sincronizacion`
- valor: `agentInfo.lastUsed || lastSync`, formateado a `es-ES`
- texto auxiliar: `Procesamiento mas reciente del agente.`

Como se muestra visualmente:

- tarjeta grande con gradiente radial azul
- tipografia grande y contraste alto
- boton de refresh con icono rotando cuando esta cargando

### 2. Grid de KPIs

Componente: `WazuhKpiGrid.tsx`

Muestra 4 cards:

1. `Eventos totales`
   - valor: suma de `alertsBySeverity`
   - subtitulo: `Volumen historico visible (historyRangeLabel).`

2. `Presion critica + alta`
   - valor: `critical + high`
   - subtitulo: `% del total actual requiere foco prioritario.`
   - porcentaje usado: `criticalPressure = ((critical + high) / totalAlerts) * 100`

3. `Hosts reportando`
   - valor: `hostsReported ?? activeAgents`
   - subtitulo: `Activos visibles dentro del historico ingerido.`

4. `Ultima sincronizacion`
   - valor: `agentInfo.lastUsed || lastSync`
   - subtitulo: `Referencia temporal del ultimo uso o corte disponible.`

Como se muestra visualmente:

- 4 tarjetas responsive
- iconos `Activity`, `AlertTriangle`, `Server`, `ScanSearch`
- glow de color por tarjeta
- fondo oscuro con bordes suaves

### 3. Bloque de graficos y distribucion

Componente: `WazuhChartsSection.tsx`

#### 3.1 Presion de alertas

No usa un chart de libreria. Es una composicion visual manual con barras HTML.

Muestra:

- `Volumen consolidado`: total de alertas historicas (`totalAlerts`)
- `Dominante`: severidad con mayor valor dentro de `alertsBySeverity`
- una barra horizontal apilada con participacion porcentual por severidad
- una lista de 4 tarjetas de severidad:
  - `Critico`
  - `Alto`
  - `Medio`
  - `Bajo`

Cada severidad muestra:

- color semantico
- porcentaje del total
- cantidad absoluta
- mini barra de progreso

Colores usados:

- `Critico`: rojo `#ef4444`
- `Alto`: naranja `#f97316`
- `Medio`: ambar `#f59e0b`
- `Bajo`: verde `#22c55e`

Adicionalmente:

- la barra superior usa `title` nativo del navegador para mostrar tooltip por segmento
- el texto inferior indica: `Pasa el cursor por la barra superior para ver el porcentaje de cada severidad.`

#### 3.2 Tendencia 7 dias

Usa `Recharts` con:

- `ResponsiveContainer`
- `AreaChart`
- `Area`
- `CartesianGrid`
- `XAxis`
- `YAxis`
- `Tooltip`

Datos usados:

- `trend7Days[]`, transformado a `trendData[]`
- cada punto tiene `date`, `critical`, `high`, `medium`, `low`, `info`, `total`

Series renderizadas:

- `critical`
- `high`
- `medium`
- `low`

Importante:

- el modelo conserva `info` en los datos, pero el grafico principal no dibuja un area para `info`
- si todos los puntos tienen total 0, no muestra chart y en su lugar muestra `No hay suficiente historial para graficar la tendencia.`

Debajo del chart muestra:

- resumen por severidad con total acumulado en la tendencia
- bloque `Balance actual` con:
  - barra apilada de distribucion actual
  - `Ruido bajo {lowNoiseShare}%`
  - `Critico + Alto: {criticalPressure}%`
  - `Predomina: {dominantSeverity.label}`

### 4. Seccion operativa

Componente: `WazuhOperationsSection.tsx`

#### 4.1 Reglas con mayor actividad

Muestra `topRules[]`.

Por cada regla muestra:

- posicion en ranking
- nombre de la regla
- texto `Regla priorizada por frecuencia`
- cantidad de eventos

Si no hay reglas, muestra estado vacio.

#### 4.2 Activo con mayor presion

Muestra `mostCriticalHost`:

- host destacado
- cantidad de eventos criticos asociados

Si existe `latestTrend`, tambien muestra 4 mini tarjetas con el ultimo corte no vacio de tendencia:

- `Critico`
- `Alto`
- `Medio`
- `Bajo`

#### 4.3 Eventos recientes

Muestra `recentFindings[]` como cards.

Cada card muestra:

- nombre del evento
- badge de severidad
- host
- fecha/hora detectada

La severidad se colorea segun `getWazuhSeverityMeta(...)`.

Mapeo visible:

- `critical` -> `Critico`
- `high` -> `Alto`
- `medium` -> `Medio`
- `low` -> `Bajo`
- cualquier otro valor -> `Info`

Si no hay findings, muestra estado vacio.

#### 4.4 Cortes recientes

Muestra `scanRows`, que salen de `scanDetails[]`.

Regla de armado:

- primero mapea todos los cortes
- si existen cortes con `total_findings > 0`, solo muestra esos
- si ninguno tiene findings, muestra todos

Cada corte muestra:

- `target`
- fecha de creacion
- `status`
- cantidad de eventos
- boton `Ver detalle`

El boton navega a `/dashboard/wazuh/scan/:id`.

### 5. Mensaje informativo final

Si `model.totalAlerts === 0` y `model.topRules.length === 0`, aparece una banda informativa con el mensaje de `metrics.message` o el fallback:

- `Wazuh no trae reglas recientes para listar, pero si existen historicos agregados para esta empresa.`

## Vista detalle por corte

Componente: `WazuhScanDetail.tsx`

Esta vista se abre desde `Cortes recientes`.

### 1. Header del detalle

Muestra:

- boton volver
- logo Wazuh
- etiqueta `Historical Detection View`
- titulo `Detalle historico de Wazuh`
- nombre del scan: `scan.scan_name || 'Wazuh scan'`
- fecha del scan: `scan.scanned_at || scan.created_at`
- `Scan ID`

### 2. Resumen del corte

Muestra 3 KPIs:

1. `Eventos del corte`
   - suma de `critical_count + high_count + medium_count + low_count + info_count`

2. `Critico + Alto`
   - porcentaje `((critical + high) / totalFindings) * 100`

3. `Registros visibles`
   - cantidad de hallazgos despues del filtro de severidad

Tambien muestra una barra horizontal de distribucion por severidad con 5 segmentos:

- critical
- high
- medium
- low
- info

### 3. Severidades del corte

Muestra 5 tarjetas, una por severidad:

- `Critico`
- `Alto`
- `Medio`
- `Bajo`
- `Info`

Cada una muestra el contador real del corte.

### 4. Tabla de eventos del corte

Los registros salen de:

- `scan.results?.vulnerabilities`
- o `scan.findings`

Incluye filtro por severidad:

- `Todos`
- `Critico`
- `Alto`
- `Medio`
- `Bajo`
- `Info`

Columnas mostradas:

- `Evento`
  - nombre o descripcion
  - descripcion corta o impacto
- `Severidad`
- `Host`
- `Referencia`
  - usa `cve || oid || rule.id || scan_id || '—'`
- `Detectado`
  - usa `created_at || timestamp`

Paginacion:

- 12 items por pagina
- botones `Anterior` y `Siguiente`
- texto `Pagina X / Y`
- texto `Mostrando A - B de N eventos`

Si no hay resultados para el filtro actual, muestra estado vacio.

## Transformaciones de datos importantes

Estas transformaciones se hacen en `buildWazuhDashboardModel(...)`:

- `totalAlerts`: suma de `alertsBySeverity`
- `currentTotalAlerts`: `currentSnapshot.totalAlerts`
- `severityDistribution`: arreglo de severidades con color, label y valor
- `dominantSeverity`: severidad con mayor conteo
- `criticalAndHigh`: `critical + high`
- `criticalPressure`: porcentaje de `critical + high` sobre `totalAlerts`
- `lowNoiseShare`: porcentaje de `low` sobre `totalAlerts`
- `lastSyncLabel`: fecha formateada de `agentInfo.lastUsed || lastSync`
- `hostsReported`: `hostsReported ?? activeAgents`
- `latestTrend`: ultimo dia de `trend7Days` con al menos un valor mayor a 0

## Como lo esta mostrando tecnicamente

- Layout principal sobre `DashboardLayout`
- estilos con Tailwind CSS
- iconografia con `lucide-react`
- grafico temporal con `Recharts`
- barras de distribucion hechas manualmente con `div` y anchos porcentuales
- diseño responsive con grids para mobile, tablet y desktop
- fechas formateadas a locale `es-ES`

## Observaciones de implementacion

- El hero prioriza mostrar la primera regla del top antes que `currentSnapshot.totalAlerts`.
- La seccion `Presion de alertas` y las cards KPI trabajan con el agregado historico `alertsBySeverity`, no con la distribucion del `currentSnapshot`.
- El titulo del segundo chart siempre dice `Tendencia 7 dias`, aunque el dashboard permite cambiar el rango desde el selector.
- En la tendencia existe el campo `info`, pero no se dibuja como serie visual en el area chart principal.

## Ejemplo real de datos esperados

Segun el fixture de pruebas (`src/test/fixtures/wazuh.ts`), un caso normal incluye:

- 8 agentes activos
- 1 inactivo
- top rules como `Authentication failure` y `Suspicious process spawned`
- severidades historicas: `critical 3`, `high 5`, `medium 12`, `low 8`
- 2 hallazgos recientes
- 3 cortes recientes
- snapshot actual con 10 alertas

Ese fixture confirma que el dashboard esta pensado para mezclar:

- agregado historico
- fotografia actual
- hallazgos recientes
- cortes historicos navegables
