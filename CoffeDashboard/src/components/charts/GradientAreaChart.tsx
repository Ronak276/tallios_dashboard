import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface AreaChartProps {
  data: {
    date: string;
    checklists: number;
    talks: number;
  }[];
  primaryLabel?: string;
  secondaryLabel?: string;
}

export const GradientAreaChart: React.FC<AreaChartProps> = ({
  data,
  primaryLabel = "Kiosk Orders",
  secondaryLabel = "Ingredient Batches",
}) => {
  return (
    <div style={{ height: '220px', width: '100%', minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={220} minWidth={0}>
        <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="safetyChecklists" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1C2C60" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#1C2C60" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="safetyTalks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C68A4C" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#C68A4C" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" style={{ opacity: 0.12 }} vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="currentColor" 
            style={{ fontSize: '11px', opacity: 0.7 }} 
            tickLine={false} 
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis 
            stroke="currentColor" 
            style={{ fontSize: '11px', opacity: 0.7 }} 
            tickLine={false} 
            axisLine={false} 
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              borderRadius: "0px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              color: "var(--foreground)",
            }}
          />
          <Area 
            type="monotone" 
            dataKey="checklists" 
            name={primaryLabel} 
            stroke="#1C2C60" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#safetyChecklists)" 
          />
          <Area 
            type="monotone" 
            dataKey="talks" 
            name={secondaryLabel} 
            stroke="#C68A4C" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#safetyTalks)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
