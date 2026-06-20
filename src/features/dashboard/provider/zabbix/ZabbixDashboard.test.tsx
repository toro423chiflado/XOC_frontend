import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ZabbixDashboard from './ZabbixDashboard';
import {
    createZabbixConfiguredMetricsFixture,
    zabbixConfiguredMetricsFixture,
    zabbixNotConfiguredFixture
} from '../../../../test/fixtures/zabbix';
import { renderWithRouter } from '../../../../test/utils/render';

vi.mock('../../../../services/provider.service', () => ({
    providerService: {
        getZabbixFullMetrics: vi.fn()
    }
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

describe('ZabbixDashboard', () => {
    const getZabbixFullMetricsMock = vi.mocked(providerService.getZabbixFullMetrics);

    beforeEach(() => {
        getZabbixFullMetricsMock.mockReset();
    });

    it('shows the loading state while Zabbix metrics are pending', async () => {
        const metricsDeferred = createDeferred<ReturnType<typeof createZabbixConfiguredMetricsFixture>>();
        getZabbixFullMetricsMock.mockReturnValueOnce(metricsDeferred.promise);

        renderWithRouter(<ZabbixDashboard />, { route: '/dashboard/zabbix' });

        expect(screen.getByText(/Cargando/i)).toBeInTheDocument();

        metricsDeferred.resolve(createZabbixConfiguredMetricsFixture());

        expect(await screen.findByRole('heading', { name: /Zabbix Monitoring Intelligence/i })).toBeInTheDocument();
    });

    it('renders the error state when Zabbix metrics fail to load', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        getZabbixFullMetricsMock.mockRejectedValueOnce(new Error('zabbix down'));

        renderWithRouter(<ZabbixDashboard />, { route: '/dashboard/zabbix' });

        expect(await screen.findByRole('heading', { name: /Zabbix No Disponible/i })).toBeInTheDocument();
        expect(screen.getByText(/No se pudo cargar la información de Zabbix/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
    });

    it('renders the not-configured state when Zabbix is unavailable for the tenant', async () => {
        getZabbixFullMetricsMock.mockResolvedValueOnce(zabbixNotConfiguredFixture);

        renderWithRouter(<ZabbixDashboard />, { route: '/dashboard/zabbix' });

        expect(await screen.findByText(/ha sido desplegado/i)).toBeInTheDocument();
        expect(screen.getByText(/Zabbix integration not configured/i)).toBeInTheDocument();
    });

    it('renders the no-agent state when Zabbix returns configured but empty telemetry', async () => {
        getZabbixFullMetricsMock.mockResolvedValueOnce(
            createZabbixConfiguredMetricsFixture({
                summary: { alerts: 0, hosts: 0, avgCpu: 0, avgRam: 0 },
                hosts: [],
                alerts: []
            })
        );

        renderWithRouter(<ZabbixDashboard />, { route: '/dashboard/zabbix' });

        expect(await screen.findByText(/ha sido desplegado/i)).toBeInTheDocument();
        expect(screen.getByText(/No hay telemetria de Zabbix para el rango seleccionado/i)).toBeInTheDocument();
    });

    it('renders the main Zabbix dashboard with hosts and alerts', async () => {
        getZabbixFullMetricsMock.mockResolvedValueOnce(zabbixConfiguredMetricsFixture);

        renderWithRouter(<ZabbixDashboard />, { route: '/dashboard/zabbix' });

        expect(await screen.findByRole('heading', { name: /Zabbix Monitoring Intelligence/i })).toBeInTheDocument();
        expect(screen.getAllByText(/Hosts monitoreados/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Estado de hosts/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Alertas recientes/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/CPU saturation over threshold/i)).toBeInTheDocument();
        expect(screen.getAllByText(/zbx-app-01/i).length).toBeGreaterThan(0);
    });
});
