import React, { useMemo } from 'react';
import {
    Clock, BarChart3, TrendingUp,
    Target, AlertCircle, Layers, Scale
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Legend, ReferenceLine, ComposedChart, Area, Cell, AreaChart, LabelList
} from 'recharts';
import { formatHoursToTime } from '../utils/dataProcessor';

interface DdDDataRow {
    Fecha: string;
    Producto: string;
    Destino: string;
    Ton_Prog: number;
    Ton_Real: number;
    Eq_Prog: number;
    Eq_Real: number;
    Regulacion_Real: number;
    sdaHours: number;
    pangHours: number;
    faenaMetaHours: number;
    faenaRealHours: number;
}

interface DdDTableroProps {
    data: DdDDataRow[];
    selectedDate: string;
    onBack?: () => void;
}

// --- SUB-COMPONENTE: CELDA KPI EN TIRA CON DIVISOR ---
const MetricCell: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    isAlert?: boolean;
    isFeatured?: boolean;
}> = React.memo(({ title, value, subtitle, icon, isAlert = false, isFeatured = false }) => (
    <div className={`p-5 sm:p-6 flex flex-col justify-between gap-3 ${
        isFeatured
            ? 'bg-[#181615] text-[#F7F6F2]'
            : isAlert
            ? 'bg-[#FEF2F2]/60 border-t-2 border-t-[#B91C1C]'
            : 'bg-[#FFFFFF]'
    }`}>
        <div className="flex items-center justify-between gap-2">
            <p className={`text-[11px] font-semibold uppercase tracking-wider leading-tight ${
                isFeatured ? 'text-[#BDB8AC]' : 'text-[#57534E]'
            }`}>{title}</p>
            <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                isFeatured
                    ? 'bg-white/10 border-white/15 text-[#C4A6EB]'
                    : isAlert
                    ? 'bg-red-50 border-red-200 text-[#B91C1C]'
                    : 'bg-[#F2F0EA] border-[#D8D4CA] text-[#461D77]'
            }`}>
                {icon}
            </div>
        </div>
        <div>
            <h3 className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-[-0.03em] ${
                isFeatured ? 'text-white' : isAlert ? 'text-[#B91C1C]' : 'text-[#181615]'
            }`}>
                {value}
            </h3>
            {subtitle && (
                <p className={`font-mono text-[11px] mt-1.5 ${
                    isFeatured ? 'text-[#A8A29E]' : 'text-[#57534E]'
                }`}>{subtitle}</p>
            )}
        </div>
    </div>
));

const SegmentChart: React.FC<{ title: string; data: any[]; color: string }> = React.memo(({ title, data, color }) => (
    <div className="surface-card p-5 rounded-lg space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E2D9] pb-3">
            <h5 className="text-xs font-bold text-[#181615] uppercase tracking-wider">{title}</h5>
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
        </div>
        <div className="h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 5, left: 5, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DFD7" />
                    <XAxis
                        dataKey="fecha"
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#57534E' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis yAxisId="left" hide domain={[0, 120]} />
                    <YAxis yAxisId="right" hide orientation="right" domain={[24, 32]} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2DFD7', fontSize: '11px', fontWeight: 600, backgroundColor: '#FFFFFF' }}
                        formatter={(v: number) => [v.toFixed(1), ""]}
                    />
                    <ReferenceLine yAxisId="left" y={90} stroke="#B91C1C" strokeDasharray="3 3" strokeWidth={1.5} />
                    <Bar yAxisId="left" dataKey="cumplimiento" fill={color} opacity={0.75} radius={[3, 3, 0, 0]} name="% Cumpl." isAnimationActive={false}>
                        <LabelList
                            dataKey="cumplimiento"
                            position="top"
                            formatter={(v: number) => `${v.toFixed(0)}%`}
                            style={{ fontSize: '10px', fontWeight: 600, fill: '#57534E' }}
                        />
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="promTon" stroke="#1C1917" strokeWidth={2} dot={{ r: 2.5, fill: '#1C1917' }} name="Tms/Eq" isAnimationActive={false}>
                        <LabelList
                            dataKey="promTon"
                            position="top"
                            formatter={(v: number) => v.toFixed(1)}
                            style={{ fontSize: '9px', fontWeight: 700, fill: '#1C1917' }}
                        />
                    </Line>
                </ComposedChart>
            </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center font-mono text-[10px] text-[#57534E] border-t border-[#E2DFD7] pt-2.5">
            <span>Últimos 10 días</span>
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm opacity-75 inline-block" style={{ backgroundColor: color }} /> Cumpl.</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#1C1917] inline-block" /> Ton/Eq</span>
            </div>
        </div>
    </div>
));

export const DdDTablero: React.FC<DdDTableroProps> = React.memo(({ data, selectedDate }) => {

    // 1. Filtrar datos del día seleccionado para la tabla
    const dayData = useMemo(() => data.filter(r => r.Fecha === selectedDate), [data, selectedDate]);

    // 2. Procesar datos para la tabla (Agrupar por Destino > Producto)
    const tableRows = useMemo(() => {
        const rows: any[] = [];
        const groupedByDest = dayData.reduce((acc, curr) => {
            const dest = curr.Destino;
            if (!acc[dest]) acc[dest] = [];
            acc[dest].push(curr);
            return acc;
        }, {} as Record<string, DdDDataRow[]>);

        (Object.entries(groupedByDest) as [string, DdDDataRow[]][]).forEach(([dest, items]) => {
            items.forEach((item: DdDDataRow, idx: number) => {
                const tonProg = item.Ton_Prog || 0;
                const tonReal = item.Ton_Real || 0;
                const cumplif = tonProg > 0 ? (tonReal / tonProg) * 100 : 0;
                const realFaena = item.faenaRealHours || 0;
                const metaFaena = item.faenaMetaHours || 2;
                const promTonReal = item.Eq_Real > 0 ? tonReal / item.Eq_Real : 0;
                const kpiPromTon = 29.2;

                rows.push({
                    destino: dest,
                    isFirstInDest: idx === 0,
                    destCount: items.length,
                    producto: item.Producto,
                    tonProg,
                    tonReal,
                    cumplif,
                    kpiFaena: metaFaena,
                    realFaena,
                    kpiReg: 10,
                    realReg: item.Regulacion_Real,
                    kpiPromTon,
                    promTonReal
                });
            });
        });
        return rows;
    }, [dayData]);

    // 3. Datos Históricos (Últimos 10 días) para gráficos
    const historicalData = useMemo(() => {
        const dates = [...new Set(data.map(r => r.Fecha))].sort();
        const last10 = dates.slice(-10);

        return last10.map(date => {
            const dayItems = data.filter(r => r.Fecha === date);
            const totalProg = dayItems.reduce((sum, r) => sum + (r.Ton_Prog || 0), 0);
            const totalReal = dayItems.reduce((sum, r) => sum + (r.Ton_Real || 0), 0);

            const validSdaItems = dayItems.filter(r => (r.sdaHours || 0) > 0);
            const avgSda = validSdaItems.length > 0 ? validSdaItems.reduce((s, r) => s + r.sdaHours, 0) / validSdaItems.length : 0;

            const validPangItems = dayItems.filter(r => (r.pangHours || 0) > 0);
            const avgPang = validPangItems.length > 0 ? validPangItems.reduce((s, r) => s + r.pangHours, 0) / validPangItems.length : 0;

            return {
                fecha: String(date).split('-').slice(1).reverse().join('/'),
                cumplimiento: totalProg > 0 ? (totalReal / totalProg) * 100 : 0,
                avgSda,
                avgPang,
                promTonReal: dayItems.reduce((sum, r) => sum + (r.Ton_Real || 0), 0) / dayItems.reduce((sum, r) => sum + (r.Eq_Real || 1), 0)
            };
        });
    }, [data]);

    // 4. Métricas de Resumen
    const summary = useMemo(() => {
        const totalP = dayData.reduce((s, r) => s + (r.Ton_Prog || 0), 0);
        const totalR = dayData.reduce((s, r) => s + (r.Ton_Real || 0), 0);

        const validSda = dayData.filter(r => (r.sdaHours || 0) > 0);
        const avgSda = validSda.length > 0 ? validSda.reduce((s, r) => s + r.sdaHours, 0) / validSda.length : 0;

        const validPang = dayData.filter(r => (r.pangHours || 0) > 0);
        const avgPang = validPang.length > 0 ? validPang.reduce((s, r) => s + r.pangHours, 0) / validPang.length : 0;

        return {
            cumplimiento: totalP > 0 ? (totalR / totalP) * 100 : 0,
            tonReal: totalR,
            avgSda,
            avgPang,
            desviaciones: tableRows.filter(r => r.cumplif < 90 || (r.realFaena > 0 && r.kpiFaena > 0 && (r.realFaena - r.kpiFaena) > (10 / 60))).length
        };
    }, [dayData, tableRows]);

    // 5. Datos Segmentados por Producto y Destino (Últimos 10 días)
    const segmentedStats = useMemo(() => {
        const dates = [...new Set(data.map(r => r.Fecha))].sort().slice(-10);

        const getStatsForFilter = (filterFn: (r: DdDDataRow) => boolean) => {
            return dates.map(date => {
                const items = data.filter(r => r.Fecha === date && filterFn(r));
                const tProg = items.reduce((s, r) => s + (r.Ton_Prog || 0), 0);
                const tReal = items.reduce((s, r) => s + (r.Ton_Real || 0), 0);
                const eReal = items.reduce((s, r) => s + (r.Eq_Real || 0), 0);
                return {
                    fecha: String(date).split('-').slice(1).reverse().join('/'),
                    cumplimiento: tProg > 0 ? (tReal / tProg) * 100 : 0,
                    promTon: eReal > 0 ? tReal / eReal : 0
                };
            });
        };

        return {
            slit: getStatsForFilter(r => r.Producto.toUpperCase().includes('SLIT')),
            lsi: getStatsForFilter(r => r.Producto.toUpperCase().includes('LSI')),
            sal: getStatsForFilter(r => r.Producto.toUpperCase().includes('SAL') || r.Producto.includes('27/15')),
            coya: getStatsForFilter(r => r.Destino.toUpperCase().includes('COYA') || r.Producto.trim().toUpperCase().endsWith(' CS') || r.Destino.toUpperCase().includes(' CS')),
            tocopilla: getStatsForFilter(r => r.Destino.toUpperCase().includes('TOCOPILLA')),
            bischofita: getStatsForFilter(r => r.Producto.toUpperCase().includes('BISCHOFITA'))
        };
    }, [data]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="min-h-screen bg-[#ECEAE3] text-[#181615] p-4 sm:p-6 md:p-8 pb-24">
            <div className="max-w-[102rem] mx-auto space-y-6" id="ddd-dashboard-capture">

                {/* HEADER EDITORIAL */}
                <header className="surface-card border-t-2 border-t-[#461D77] rounded-lg p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider">
                            <span className="text-[#461D77]">Tablero M1</span>
                            <span className="text-[#BDB8AC]" aria-hidden="true">/</span>
                            <span className="text-[#57534E]">Gestión Diaria Despacho Litio</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-[#181615] uppercase leading-none">
                            DIÁLOGO DE DESEMPEÑO
                        </h1>
                    </div>

                    <div className="flex items-center gap-5 bg-[#181615] text-white rounded-lg px-5 py-3.5 shadow-[0_2px_6px_rgba(24,22,21,0.18)]">
                        <div className="text-right border-r border-white/15 pr-5 hidden sm:block">
                            <p className="font-mono text-[10px] font-semibold text-[#A8A29E] uppercase tracking-wider">
                                Jornada Reportada
                            </p>
                            <span className="font-mono text-lg font-bold tabular-nums text-white">
                                {formatDate(selectedDate) || 'Sin fecha'}
                            </span>
                        </div>

                        <div className="bg-[#FFFFFF] px-3 py-1.5 rounded-md flex items-center justify-center shrink-0">
                            <img
                                src="/novandino.png"
                                alt="Novandino"
                                className="h-8 w-auto object-contain"
                            />
                        </div>
                    </div>
                </header>

                {/* TIRA HORIZONTAL DE KPIs CON DIVISORES 1PX */}
                <section className="surface-card rounded-lg overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 sm:divide-x divide-[#E5E2D9]">
                        <MetricCell
                            title="Cumplimiento Global"
                            value={`${summary.cumplimiento.toFixed(1)}%`}
                            subtitle="Meta operacional >= 90%"
                            icon={<Target size={15} />}
                            isFeatured={!(summary.cumplimiento > 0 && summary.cumplimiento < 90)}
                            isAlert={summary.cumplimiento > 0 && summary.cumplimiento < 90}
                        />
                        <MetricCell
                            title="Tms. Reales Despachadas"
                            value={Math.round(summary.tonReal).toLocaleString('es-CL')}
                            subtitle="Total consolidado jornada"
                            icon={<BarChart3 size={15} />}
                        />
                        <MetricCell
                            title="Tiempo Promedio SdA"
                            value={formatHoursToTime(summary.avgSda)}
                            subtitle={`Meta SQM: ${formatHoursToTime(2)}`}
                            icon={<Clock size={15} />}
                        />
                        <MetricCell
                            title="Tiempo Promedio N. Y."
                            value={formatHoursToTime(summary.avgPang)}
                            subtitle={`Meta SQM: ${formatHoursToTime(2)}`}
                            icon={<Scale size={15} />}
                        />
                        <MetricCell
                            title="Alertas Activas (DdD)"
                            value={summary.desviaciones}
                            subtitle="Puntos con desviación crítica"
                            icon={<AlertCircle size={15} />}
                            isAlert={summary.desviaciones > 0}
                        />
                    </div>
                </section>

                {/* GRILLA ASIMÉTRICA: TABLA (8/12) + TENDENCIA (4/12) */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                    {/* COLUMNA IZQUIERDA: TABLA (8/12) */}
                    <div className="xl:col-span-8">
                        <div className="surface-card rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#E5E2D9] flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#F2F0EA] border border-[#D8D4CA] text-[#461D77] rounded-md flex items-center justify-center">
                                        <Layers size={16} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#181615] tracking-tight text-sm uppercase">
                                            Matriz de Desempeño Operacional
                                        </h3>
                                        <p className="font-mono text-[11px] text-[#57534E]">
                                            Desglose por Destino y Producto
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-5 font-mono text-[11px]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-sm bg-[#B91C1C]" />
                                        <span className="text-[#57534E]">Desviación (&lt;90%)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-sm bg-[#15803D]" />
                                        <span className="text-[#57534E]">En Meta</span>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#E7E4DC] text-[#44403C] font-mono text-[11px] uppercase tracking-wider border-b border-[#D8D4CA]">
                                            <th className="px-5 py-3.5 font-bold">Destino</th>
                                            <th className="px-5 py-3.5 font-bold">Producto</th>
                                            <th className="px-5 py-3.5 font-bold text-center">% Cumplimiento</th>
                                            <th className="px-5 py-3.5 font-bold text-center">Tiempo Faena</th>
                                            <th className="px-5 py-3.5 font-bold text-right">Desempeño Tms/Eq</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-mono tabular-nums divide-y divide-[#E5E2D9]">
                                        {tableRows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-[#F5F3EE] transition-colors duration-150">
                                                {row.isFirstInDest && (
                                                    <td
                                                        className="px-5 py-4 bg-[#F5F3EE] text-[#181615] font-sans font-bold align-middle border-r border-[#D8D4CA]"
                                                        rowSpan={row.destCount}
                                                    >
                                                        <span className="text-sm tracking-tight block">{row.destino}</span>
                                                    </td>
                                                )}
                                                <td className="px-5 py-4 font-sans font-semibold text-[#181615] uppercase text-xs">
                                                    {row.producto}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span className={`font-bold text-sm tabular-nums ${
                                                            row.cumplif < 90
                                                                ? 'text-[#B91C1C]'
                                                                : 'text-[#15803D]'
                                                        }`}>
                                                            {row.cumplif.toFixed(1)}%
                                                        </span>
                                                        <div className="w-20 h-1.5 bg-[#E5E2D9] rounded-sm overflow-hidden">
                                                            <div
                                                                className={`h-full ${row.cumplif < 90 ? 'bg-[#B91C1C]' : 'bg-[#461D77]'}`}
                                                                style={{ width: `${Math.min(row.cumplif, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`text-sm font-semibold ${
                                                        (row.realFaena > 0 && row.kpiFaena > 0 && (row.realFaena - row.kpiFaena) > (10 / 60))
                                                            ? 'text-[#B91C1C]'
                                                            : 'text-[#181615]'
                                                    }`}>
                                                        {formatHoursToTime(row.realFaena)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-sm font-bold ${row.promTonReal < row.kpiPromTon ? 'text-[#B91C1C]' : 'text-[#15803D]'}`}>
                                                            {row.promTonReal.toFixed(1)} Tms
                                                        </span>
                                                        <span className="text-[11px] text-[#57534E]">
                                                            Meta {row.kpiPromTon}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: ANALÍTICA RÁPIDA (4/12) */}
                    <div className="xl:col-span-4">
                        <div className="surface-card p-6 rounded-lg space-y-5 h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between border-b border-[#E5E2D9] pb-4">
                                <div>
                                    <h4 className="text-sm font-bold text-[#181615] uppercase tracking-wider">
                                        Tendencia de Tiempos
                                    </h4>
                                    <p className="font-mono text-[11px] text-[#57534E] mt-0.5">
                                        Últimos 10 días operacionales
                                    </p>
                                </div>
                                <div className="w-8 h-8 bg-[#F2F0EA] border border-[#D8D4CA] text-[#461D77] rounded-md flex items-center justify-center">
                                    <TrendingUp size={16} />
                                </div>
                            </div>

                            <div className="h-[340px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={historicalData}>
                                        <defs>
                                            <linearGradient id="colorSda" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#461D77" stopOpacity={0.22}/>
                                                <stop offset="95%" stopColor="#461D77" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorPang" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#57534E" stopOpacity={0.18}/>
                                                <stop offset="95%" stopColor="#57534E" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DFD7" />
                                        <XAxis
                                            dataKey="fecha"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#57534E', fontSize: 11, fontWeight: 600 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#57534E', fontSize: 11, fontWeight: 600 }}
                                            tickFormatter={(val) => formatHoursToTime(val)}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #E2DFD7', backgroundColor: '#FFFFFF', fontSize: '11px' }}
                                            labelStyle={{ fontWeight: 700, color: '#1C1917' }}
                                            formatter={(value: number) => [formatHoursToTime(value), ""]}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            height={34}
                                            iconType="square"
                                            wrapperStyle={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', paddingBottom: '12px' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="avgSda"
                                            stroke="#461D77"
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#colorSda)"
                                            name="Promedio SdA"
                                            isAnimationActive={false}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="avgPang"
                                            stroke="#57534E"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorPang)"
                                            name="Promedio N. Y."
                                            isAnimationActive={false}
                                        />
                                        <ReferenceLine y={2} stroke="#B91C1C" strokeDasharray="5 5" strokeWidth={1.5} label={{ position: 'right', value: 'META', fill: '#B91C1C', fontSize: 10, fontWeight: 700 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN DE ANALÍTICA SEGMENTADA */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <h3 className="font-mono text-xs font-semibold text-[#57534E] uppercase tracking-wider shrink-0">
                            Desempeño por Segmento (10 días)
                        </h3>
                        <div className="h-px flex-1 bg-[#E2DFD7]" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SegmentChart title="Segmento SLIT" data={segmentedStats.slit} color="#461D77" />
                        <SegmentChart title="Segmento LSI" data={segmentedStats.lsi} color="#461D77" />
                        <SegmentChart title="Segmento Sal 27/15" data={segmentedStats.sal} color="#57534E" />
                        <SegmentChart title="Destino Coya Sur" data={segmentedStats.coya} color="#461D77" />
                        <SegmentChart title="Destino Tocopilla" data={segmentedStats.tocopilla} color="#57534E" />
                        <SegmentChart title="Bischofita" data={segmentedStats.bischofita} color="#1C1917" />
                    </div>
                </div>

                {/* DASHBOARD COMPLETITUD Y CUMPLIMIENTO */}
                <div className="surface-card p-6 sm:p-8 rounded-lg space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E2D9] pb-4">
                        <div>
                            <h4 className="text-lg font-extrabold text-[#181615] tracking-tight uppercase">
                                Análisis de Cumplimiento Programático
                            </h4>
                            <p className="font-mono text-xs text-[#57534E] mt-0.5">
                                Eficiencia de despacho y tonelaje promedio por equipo
                            </p>
                        </div>
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#15803D] self-start md:self-auto">
                            Operación Activa
                        </span>
                    </div>

                    <div className="h-[360px] w-full surface-well p-4 sm:p-6 rounded-md">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={historicalData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DFD7" />
                                <XAxis
                                    dataKey="fecha"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#57534E', fontSize: 11, fontWeight: 600 }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#57534E', fontSize: 11, fontWeight: 600 }}
                                    domain={[0, 110]}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    domain={[26, 30]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#1C1917', fontSize: 11, fontWeight: 600 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2DFD7' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                    labelStyle={{ fontWeight: 700, color: '#1C1917' }}
                                />
                                <Legend verticalAlign="top" height={34} iconType="square" wrapperStyle={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }} />
                                <Bar yAxisId="left" dataKey="cumplimiento" fill="#461D77" opacity={0.85} radius={[4, 4, 0, 0]} barSize={40} name="% Cumplimiento" isAnimationActive={false}>
                                    <LabelList dataKey="cumplimiento" position="top" formatter={(val: number) => `${Math.round(val)}%`} style={{ fill: '#461D77', fontSize: 10, fontWeight: 700 }} />
                                </Bar>
                                <Line yAxisId="right" type="stepAfter" dataKey="promTonReal" stroke="#1C1917" strokeWidth={2.5} dot={{ r: 4, fill: '#1C1917', strokeWidth: 1.5, stroke: '#FFFFFF' }} name="Eficiencia Tms/Eq" isAnimationActive={false}>
                                    <LabelList dataKey="promTonReal" position="top" formatter={(val: number) => val.toFixed(1)} style={{ fill: '#1C1917', fontSize: 10, fontWeight: 700 }} offset={8} />
                                </Line>
                                <ReferenceLine yAxisId="left" y={90} stroke="#B91C1C" strokeDasharray="5 5" strokeWidth={1.5} label={{ position: 'insideTopLeft', value: 'META CARGA 90%', fill: '#B91C1C', fontSize: 10, fontWeight: 700 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* FOOTER EJECUTIVO */}
                <div className="pt-4 border-t border-[#E2DFD7] flex justify-between items-center font-mono text-[11px] text-[#57534E] uppercase tracking-wider">
                    <span>Subgerencia Logística Litio</span>
                    <span>Despacho Litio · Tablero M1</span>
                </div>
            </div>
        </div>
    );
});

export default DdDTablero;
