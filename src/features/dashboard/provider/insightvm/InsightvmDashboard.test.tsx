import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InsightvmDashboard from './InsightvmDashboard';
import {
    createInsightvmAnalyticsFixture,
    createInsightvmMetricsFixture,
    insightvmEmptyMetricsFixture
} from '../../../../test/fixtures/insightvm';
import { renderWithRouter } from '../../../../test/utils/render';

vi.mock('../../../../services/provider.service', () => ({
    providerService: {
        getInsightvmMetrics: vi.fn(),
        getInsightvmAnalytics: vi.fn()
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

describe('InsightvmDashboard', () => {
    const getInsightvmMetricsMock = vi.mocked(providerService.getInsightvmMetrics);
    const getInsightvmAnalyticsMock = vi.mocked(providerService.getInsightvmAnalytics);

    beforeEach(() => {
        getInsightvmMetricsMock.mockReset();
        getInsightvmAnalyticsMock.mockReset();
    });

    it('shows a loading state before the metrics resolve', async () => {
        const metricsDeferred = createDeferred<ReturnType<typeof createInsightvmMetricsFixture>>();
        getInsightvmMetricsMock.mockReturnValueOnce(metricsDeferred.promise);
        getInsightvmAnalyticsMock.mockResolvedValueOnce(createInsightvmAnalyticsFixture());

        renderWithRouter(<InsightvmDashboard />);

        expect(screen.getByText(/Cargando/i)).toBeInTheDocument();

        metricsDeferred.resolve(createInsightvmMetricsFixture());

        expect(await screen.findByRole('heading', { name: /InsightVM Vulnerability Intelligence/i })).toBeInTheDocument();
    });

    it('renders an error state when the InsightVM request fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        getInsightvmMetricsMock.mockRejectedValueOnce(new Error('backend down'));
        getInsightvmAnalyticsMock.mockResolvedValueOnce(null);

        renderWithRouter(<InsightvmDashboard />);

        expect(await screen.findByRole('heading', { name: /InsightVM No Disponible/i })).toBeInTheDocument();
        expect(screen.getByText(/backend/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
    });

    it('renders the empty state when the integration has no scans yet', async () => {
        getInsightvmMetricsMock.mockResolvedValueOnce(insightvmEmptyMetricsFixture);
        getInsightvmAnalyticsMock.mockResolvedValueOnce(null);

        renderWithRouter(<InsightvmDashboard />);

        expect(await screen.findByText(/ha sido desplegado/i)).toBeInTheDocument();
        expect(screen.getByText(/InsightVM Rapid7/i)).toBeInTheDocument();
    });

    it('falls back to the no-agent state when the backend returns 404', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        getInsightvmMetricsMock.mockRejectedValueOnce({
            response: {
                status: 404
            }
        });
        getInsightvmAnalyticsMock.mockResolvedValueOnce(null);

        renderWithRouter(<InsightvmDashboard />);

        expect(await screen.findByText(/ha sido desplegado/i)).toBeInTheDocument();
        expect(screen.getByText(/InsightVM Rapid7/i)).toBeInTheDocument();
    });

    it('renders the main dashboard with KPIs, top CVEs, findings and recent scans', async () => {
        getInsightvmMetricsMock.mockResolvedValueOnce(createInsightvmMetricsFixture());
        getInsightvmAnalyticsMock.mockResolvedValueOnce(createInsightvmAnalyticsFixture());

        renderWithRouter(<InsightvmDashboard />);

        expect(await screen.findByRole('heading', { name: /InsightVM Vulnerability Intelligence/i })).toBeInTheDocument();
        expect(screen.getByText(/Total vulnerabilidades/i)).toBeInTheDocument();
        expect(screen.getByText(/Riesgo severo/i)).toBeInTheDocument();
        expect(screen.getAllByText(/CVE-2024-3094/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/OpenSSH username enumeration/i)).toBeInTheDocument();
        expect(screen.getAllByText(/srv-db-01/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Escaneos recientes/i)).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /Ver reporte/i })).toHaveLength(3);
    });
});
