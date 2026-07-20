import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// Custom dark tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl font-sans text-xs">
        <p className="text-slate-400 font-mono mb-1">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} className="font-semibold" style={{ color: p.color }}>
            {p.name}: {p.value} {p.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ========================================================
// 1. LINE CHART: WEIGHT TREND & BMI
// ========================================================
interface WeightTrendChartProps {
  data: Array<{
    date: string;
    weight: number;
    bmi: number;
  }>;
}

export function WeightTrendChart({ data }: WeightTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-950/40 rounded-2xl border border-slate-850/60 text-slate-500">
        <p className="text-xs">No historical weight records found.</p>
        <p className="text-[10px] mt-1">Submit your profile assessment to log your first weight record.</p>
      </div>
    );
  }

  // Format date strings for chart
  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="105%">
        <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
          <defs>
            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="formattedDate"
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={['dataMin - 3', 'dataMax + 3']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            name="Weight"
            type="monotone"
            dataKey="weight"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 1 }}
            activeDot={{ r: 6 }}
            unit=" kg"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ========================================================
// 2. BAR CHART: SLEEP TREND VS OPTIMAL RANGE
// ========================================================
interface SleepTrendChartProps {
  data: Array<{
    date: string;
    sleep: number;
    exercise: number;
  }>;
}

export function SleepTrendChart({ data }: SleepTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-950/40 rounded-2xl border border-slate-850/60 text-slate-500">
        <p className="text-xs">No sleep history logged.</p>
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="105%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="formattedDate"
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, 12]}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={8} stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "8h Optimal", position: "insideTopRight", fill: "#3b82f6", fontSize: 9 }} />
          <Bar
            name="Sleep Hours"
            dataKey="sleep"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            unit=" hrs"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ========================================================
// 3. PIE CHART: HEALTH SCORE COMPONENTS (BREAKDOWN)
// ========================================================
interface DiseaseRiskPieChartProps {
  breakdown: {
    sleep: number;
    exercise: number;
    diet: number;
    water: number;
    stress: number;
    bmi: number;
  } | null;
}

export function DiseaseRiskPieChart({ breakdown }: DiseaseRiskPieChartProps) {
  // Fallback default breakdown if not loaded
  const categories = breakdown
    ? [
        { name: 'Rest (Sleep)', value: breakdown.sleep, color: '#6366f1' },
        { name: 'Activity (Exercise)', value: breakdown.exercise, color: '#10b981' },
        { name: 'Hydration (Water)', value: breakdown.water, color: '#0ea5e9' },
        { name: 'Stress Relief', value: breakdown.stress, color: '#f59e0b' },
        { name: 'Physical (BMI)', value: breakdown.bmi, color: '#ec4899' },
        { name: 'Nutrition (Diet)', value: breakdown.diet || 15, color: '#8b5cf6' },
      ]
    : [
        { name: 'Rest (Sleep)', value: 15, color: '#6366f1' },
        { name: 'Activity (Exercise)', value: 15, color: '#10b981' },
        { name: 'Hydration (Water)', value: 15, color: '#0ea5e9' },
        { name: 'Stress Relief', value: 15, color: '#f59e0b' },
        { name: 'Physical (BMI)', value: 15, color: '#ec4899' },
        { name: 'Nutrition (Diet)', value: 15, color: '#8b5cf6' },
      ];

  const totalValue = categories.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
      {/* Container for Pie */}
      <div className="w-1/2 h-full min-h-[160px] relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={1.5} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} pts`, 'Score Contribution']}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
              itemStyle={{ color: '#cbd5e1', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute text-center flex flex-col items-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Health</span>
          <span className="text-sm font-bold text-slate-100">Components</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-1.5 px-2">
        {categories.map((c, idx) => {
          const pct = ((c.value / (totalValue || 1)) * 100).toFixed(0);
          return (
            <div key={idx} className="flex items-center justify-between text-xs font-sans">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-slate-300 font-medium truncate max-w-[130px]">{c.name}</span>
              </div>
              <span className="font-mono text-slate-400 text-[11px] font-medium">{c.value} pts ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
