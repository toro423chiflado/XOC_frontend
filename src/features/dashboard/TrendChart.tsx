import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { time: '00:00', events: 40, critical: 24 },
    { time: '04:00', events: 30, critical: 13 },
    { time: '08:00', events: 20, critical: 9 },
    { time: '12:00', events: 27, critical: 39 },
    { time: '16:00', events: 18, critical: 48 },
    { time: '20:00', events: 23, critical: 38 },
    { time: '23:59', events: 34, critical: 43 },
];

export default function TrendChart() {
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Tendencia de Eventos (24h)</h3>
            <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00ff9f" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00ff9f" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff00ff" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ff00ff" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="time" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="events" stroke="#00ff9f" fillOpacity={1} fill="url(#colorEvents)" strokeWidth={2} />
                        <Area type="monotone" dataKey="critical" stroke="#ff00ff" fillOpacity={1} fill="url(#colorCritical)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
