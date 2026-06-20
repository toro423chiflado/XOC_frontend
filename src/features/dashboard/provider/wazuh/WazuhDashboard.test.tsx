import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WazuhDashboard from './WazuhDashboard';
import {
    createWazuhMetricsFixture,
    wazuhEmptyMetricsFixture,
    wazuhMetricsFixture
} from '../../../../test/fixtures/wazuh';
import { renderWithRouter } from '../../../../test/utils/render';

vi.mock('../../../../services/provider.service', () => ({
    providerService: {
        getWazuhMetrics: vi.fn()
    }
}));

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="recharts-responsive">{children}</div>,
    AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Area: () => null,
    Bar: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null
}));

vi.mock('../../DashboardLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dashboard-layout">{children}</div>
    )
}));

import { providerService } from '../../../../services/provider.service';

const createDeferred = <T,>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((innerResolve, innerReject) => {
        resolve = innerResolve;
        reject = innerReject;
    });

    return { promise, resolve, reject };
};

describe('WazuhDashboard', () => {
    const getWazuhMetricsMock = vi.mocked(providerService.getWazuhMetrics);

    beforeEach(() => {
        getWazuhMetricsMock.mockReset();
    });

    it('shows a loading spinner while Wazuh metrics are pending', async () => {
        const metricsDeferred = createDeferred<ReturnType<typeof createWazuhMetricsFixture>>();
        getWazuhMetricsMock.mockReturnValueOnce(metricsDeferred.promise);

        renderWithRouter(<WazuhDashboard />, { route: '/dashboard/wazuh' });

        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();

        metricsDeferred.resolve(createWazuhMetricsFixture());

        expect(await screen.findByRole('heading', { name: /Wazuh Security Event Intelligence/i })).toBeInTheDocument();
    });

    it('renders the error state when Wazuh metrics fail', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        getWazuhMetricsMock.mockRejectedValueOnce(new Error('wazuh down'));

        renderWithRouter(<WazuhDashboard />, { route: '/dashboard/wazuh' });

        expect(await screen.findByRole('heading', { name: /Wazuh No Disponible/i })).toBeInTheDocument();
        expect(screen.getByText(/No se pudo cargar la informacion de Wazuh/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
    });

    it('renders the no-agent state when Wazuh is not configured', async () => {
        getWazuhMetricsMock.mockResolvedValueOnce(wazuhEmptyMetricsFixture);

        renderWithRouter(<WazuhDashboard />, { route: '/dashboard/wazuh' });

        expect(await screen.findByText(/ha sido desplegado/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Tu Agente Wazuh/i })).toBeInTheDocument();
        expect(screen.getAllByText(/No hay historicos disponibles de Wazuh/i).length).toBeGreaterThan(0);
    });

    it('renders the no-agent state when Wazuh returns configured but empty telemetry', async () => {
        getWazuhMetricsMock.mockResolvedValueOnce(
            createWazuhMetricsFixture({
                configured: true,
                message: undefined,
                topRules: [],
                recentFindings: [],
                scanDetails: [],
                alertsBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                currentSnapshot: {
                    scanId: undefined,
                    scannedAt: undefined,
                    totalAlerts: 0,
                    alertsBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
                },
                historical: {
                    totalScans: 0,
                    totalEvents: 0,
                    severityTotals: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                    criticalPressurePct: 0,
                    noiseSharePct: 0,
                    avgEventsPerCut: 0,
                    peakCutEvents: 0,
                    medianEventsPerCut: 0,
                    scanCadenceMinutesMedian: null,
                    cuts: []
                },
                snapshot: {
                    scanSummaryId: null,
                    scanId: null,
                    scanName: null,
                    agentName: null,
                    scannedAt: null,
                    windowStart: null,
                    windowEnd: null,
                    totalEvents: 0,
                    severityTotals: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                    dominantSeverity: 'none',
                    topRules: [],
                    topAgents: [],
                    sendReason: null,
                    snapshotMode: null
                },
                analytics: {
                    trend: [],
                    uniqueAgentsInRange: 0,
                    avgEventsPerAgentInRange: 0,
                    mostPressuredAgent: undefined,
                    recentEvents: []
                }
            })
        );

        renderWithRouter(<WazuhDashboard />, { route: '/dashboard/wazuh' });

        expect(await screen.findByText(/ha sido desplegado/i)).toBeInTheDocument();
        expect(screen.getByText(/No hay telemetria de Wazuh para el rango seleccionado/i)).toBeInTheDocument();
    });

    it('renders the redesigned Wazuh dashboard with snapshot and historical sections', async () => {
        getWazuhMetricsMock.mockResolvedValueOnce(wazuhMetricsFixture);

        renderWithRouter(<WazuhDashboard />, { route: '/dashboard/wazuh' });

        expect(await screen.findByRole('heading', { name: /Wazuh Security Event Intelligence/i })).toBeInTheDocument();
        expect(screen.getByText(/Snapshot operativo/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Authentication failure/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Evidencia reciente/i)).toBeInTheDocument();
        expect(screen.getByText(/Multiple failed logins detected/i)).toBeInTheDocument();
        expect(screen.getByText(/Tabla de cortes/i)).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /Ver detalle/i })).toHaveLength(3);
    });

    it('validates custom ranges before requesting Wazuh data', async () => {
        getWazuhMetricsMock.mockResolvedValueOnce(wazuhMetricsFixture);

        renderWithRouter(<WazuhDashboard />, { route: '/dashboard/wazuh' });

        expect(await screen.findByRole('heading', { name: /Wazuh Security Event Intelligence/i })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Últimos 7 días/i }));
        fireEvent.click(screen.getByRole('button', { name: /Rango Personalizado/i }));

        fireEvent.click(screen.getByRole('button', { name: /Actualizar/i }));

        expect(screen.getByText(/Selecciona fechas/i)).toBeInTheDocument();
        expect(getWazuhMetricsMock).toHaveBeenCalledTimes(1);
    });
});
