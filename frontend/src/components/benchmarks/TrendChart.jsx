import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TrendChart = ({ data, dataKey, title, color = "#22c55e", height = 350, theme = "dark" }) => {
  const isLight = theme === "light";
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Format data for Recharts
  const formattedData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
    value: item.value,
    source: item.source_title
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`trend-chart-tooltip ${isLight ? "trend-chart-tooltip--light" : ""}`} style={{
          background: 'var(--theme-bg-overlay)',
          border: '1px solid var(--theme-border-accent)',
          borderRadius: '8px',
          padding: isMobile ? '8px' : '12px',
          color: 'var(--theme-text-primary)',
          fontSize: isMobile ? '0.75rem' : '0.875rem',
          maxWidth: isMobile ? '160px' : 'none'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].payload.date}</p>
          <p style={{ margin: '4px 0 0 0', color: color }}>
            {dataKey}: {payload[0].value}
          </p>
          {payload[0].payload.source && (
            <p style={{ margin: '4px 0 0 0', fontSize: isMobile ? '0.625rem' : '0.75rem', color: 'var(--theme-text-secondary)', lineHeight: 1.2 }}>
              Source: {payload[0].payload.source}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Responsive chart height
  const chartHeight = isMobile ? 220 : height;

  return (
    <div className="trend-chart" style={{ width: '100%', height: chartHeight }}>
      <h4 className="trend-chart__title" style={{ 
        fontSize: isMobile ? '0.8125rem' : '0.9375rem', 
        fontWeight: 600, 
        marginBottom: isMobile ? '0.5rem' : '1rem',
        lineHeight: 1.3
      }}>
        {title}
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={formattedData} 
          margin={{ 
            top: 5, 
            right: isMobile ? 15 : 30, 
            left: isMobile ? -15 : 20, 
            bottom: isMobile ? 45 : 5 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border-subtle)" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="var(--theme-text-subtle)"
            style={{ fontSize: isMobile ? '0.6rem' : '0.75rem' }}
            tick={{ 
              fill: 'var(--theme-text-subtle)',
              angle: isMobile ? -45 : 0,
              textAnchor: isMobile ? 'end' : 'middle'
            }}
            interval={isMobile ? "preserveStartEnd" : 0}
            minTickGap={isMobile ? 40 : 5}
            dy={isMobile ? 10 : 10}
            height={isMobile ? 50 : 30}
          />
          <YAxis 
            stroke="var(--theme-text-subtle)"
            style={{ fontSize: isMobile ? '0.6rem' : '0.75rem' }}
            tick={{ fill: 'var(--theme-text-subtle)' }}
            width={isMobile ? 35 : 40}
            tickCount={isMobile ? 5 : 6}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={isMobile ? 1.5 : 2}
            dot={isMobile ? false : { fill: color, r: 4 }}
            activeDot={{ r: isMobile ? 4 : 6 }}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;

