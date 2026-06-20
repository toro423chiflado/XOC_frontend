import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OpenvasDashboard from './OpenvasDashboard';
import {
    createOpenvasAnalyticsFixture,
    createOpenvasMetricsFixture,
    openvasEmptyMetricsFixture
} from '../../../../test/fixtures/openvas';
import { renderWithRouter } from '../../../../test/utils/render';

vi.mock('../../../../services/provider.service', () => ({
    providerService: {
        getOpenvasMetrics: vi.fn(),
        getOpenvasAnalytics: vi.fn()
    }
}));

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="recharts-responsive">{children}</div>,
    AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Pie: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Cell: () => null,
    Area: () => null,
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

describe('OpenvasDashboard', () => {
    const getOpenvasMetricsMock = vi.mocked(providerService.getOpenvasMetrics);
    const getOpenvasAnalyticsMock = vi.mocked(providerService.getOpenvasAnalytics);

    beforeEach(() => {
        getOpenvasMetricsMock.mockReset();
        getOpenvasAnalyticsMock.mockReset();
    });

    it('shows the loading state while OpenVAS metrics are pending', async () => {
        const metricsDeferred = createDeferred<ReturnType<typeof createOpenvasMetricsFixture>>();
        getOpenvasMetricsMock.mockReturnValueOnce(metricsDeferred.promise);
        getOpenvasAnalyticsMock.mockResolvedValueOnce(createOpenvasAnalyticsFixture());

        renderWithRouter(<OpenvasDashboard />, { route: '/dashboard/openvas' });

        expect(screen.getByText(/Cargando/i)).toBeInTheDocument();

        metricsDeferred.resolve(createOpenvasMetricsFixture());

        expect(await screen.findByRole('heading', { name: /OpenVAS Vulnerability Intelligence/i })).toBeInTheDocument();
    });

    it('renders the backend error state when OpenVAS metrics fail to load', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        getOpenvasMetricsMock.mockRejectedValueOnce(new Error('openvas down'));
        getOpenvasAnalyticsMock.mockResolvedValueOnce(null);

        renderWithRouter(<OpenvasDashboard />, { route: '/dashboard/openvas' });

        expect(await screen.findByRole('heading', { name: /Backend No Disponible/i })).toBeInTheDocument();
        expect(screen.getByText(/OpenVAS/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
    });

    it('renders the no-agent state when there are no historical scans yet', async () => {
        getOpenvasMetricsMock.mockResolvedValueOnce(openvasEmptyMetricsFixture);
        getOpenvasAnalyticsMock.mockResolvedValueOnce(null);

        renderWithRouter(<OpenvasDashboard />, { route: '/dashboard/openvas' });

        expect(await screen.findByText(/ha sido desplegado/i)).toBeInTheDocument();
        expect(screen.getAllByText(/OpenVAS/i).length).toBeGreaterThan(0);
    });

    it('renders the main OpenVAS dashboard with risk and exposure sections', async () => {
        getOpenvasMetricsMock.mockResolvedValueOnce(createOpenvasMetricsFixture());
        getOpenvasAnalyticsMock.mockResolvedValueOnce(createOpenvasAnalyticsFixture());

        renderWithRouter(<OpenvasDashboard />, { route: '/dashboard/openvas' });

        expect(await screen.findByRole('heading', { name: /OpenVAS Vulnerability Intelligence/i })).toBeInTheDocument();
        expect(screen.getByText(/Lectura ejecutiva del riesgo/i)).toBeInTheDocument();
        expect(screen.getByText(/CVEs que dominan el contexto/i)).toBeInTheDocument();
        expect(screen.getByText(/Reportes recientes/i)).toBeInTheDocument();
        expect(screen.getAllByText(/CVE-2024-30080/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/db-core-01/i).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', { name: /Ver reporte/i }).length).toBeGreaterThan(0);
    });
});
