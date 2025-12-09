export default function Health({ stats }: any) {
  const tempColor =
    stats?.cpuTemp > 85 ? 'bg-red-500' : stats?.cpuTemp > 80 ? 'bg-yellow-500' : 'bg-green-500';

  const tempPercent = (stats?.cpuTemp / 100) * 100;
  const loadPercent = stats?.cpuLoad || 0;

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-sm font-bold text-slate-400 mb-4">SYSTEM HEALTH</h3>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>CPU Temp</span>
            <span className={tempColor + ' px-2 py-1 rounded text-white text-xs font-bold'}>
              {stats?.cpuTemp?.toFixed(1)}°C
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded h-2">
            <div
              className={`h-full ${tempColor} rounded transition-all`}
              style={{ width: `${Math.min(tempPercent, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>CPU Load</span>
            <span>{loadPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded h-2">
            <div
              className="h-full bg-cyan-500 rounded transition-all"
              style={{ width: `${Math.min(loadPercent, 100)}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-slate-400 pt-2">
          <p>Power: {stats?.powerSource}</p>
        </div>
      </div>
    </div>
  );
}
