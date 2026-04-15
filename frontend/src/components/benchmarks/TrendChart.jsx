import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TrendChart = ({ data, dataKey, title, color = "#22c55e", height = 350, theme = "dark" }) => {
  const isLight = theme === "light";
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 480 : false
  );

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    handleResize();
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
          padding: '12px',
          color: 'var(--theme-text-primary)'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].payload.date}</p>
          <p style={{ margin: '4px 0 0 0', color: color }}>
            {dataKey}: {payload[0].value}
          </p>
          {payload[0].payload.source && (
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--theme-text-secondary)' }}>
              Source: {payload[0].payload.source}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="trend-chart" style={{ width: '100%' }}>
      <h4 className="trend-chart__title" style={{ 
        fontSize: '0.9375rem', 
        fontWeight: 600, 
        marginBottom: '1rem'
      }}>
        {title}
      </h4>
      <div style={{ width: '100%', height: height - 40, minHeight: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ 
            top: 5, 
            right: isMobile ? 10 : 30, 
            left: isMobile ? -15 : 20, 
            bottom: isMobile ? 25 : 5 
          }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border-subtle)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--theme-text-subtle)"
              style={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? "end" : "middle"}
              height={isMobile ? 50 : 30}
              tickMargin={isMobile ? 5 : 5}
            />
            <YAxis 
              stroke="var(--theme-text-subtle)"
              style={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
              width={isMobile ? 35 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;

