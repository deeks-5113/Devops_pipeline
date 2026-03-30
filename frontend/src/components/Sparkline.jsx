import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const Sparkline = ({ data, color }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-8 mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="cpu"
            stroke={color}
            strokeWidth={1.5}
            fillOpacity={1}
            fill={`url(#gradient-${color})`}
            animationDuration={800}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Sparkline;
