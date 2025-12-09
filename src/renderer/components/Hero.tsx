export default function Hero({ stats }: any) {
  const statusColor =
    stats?.cpuTemp > 85
      ? 'text-red-500'
      : stats?.cpuTemp > 80
        ? 'text-yellow-500'
        : 'text-green-500';

  return (
    <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-lg p-8 text-center">
      <h2 className="text-5xl font-bold mb-2">
        ${(stats?.usdPerDay || 0).toFixed(4)}
        <span className="text-lg">/day</span>
      </h2>
      <p className="text-cyan-100 mb-6">{(stats?.xmrPerDay || 0).toFixed(8)} XMR/day</p>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-cyan-100">Hashrate</p>
          <p className="font-bold">{(stats?.hashrate / 1000).toFixed(1)} KH/s</p>
        </div>
        <div>
          <p className="text-cyan-100">Uptime</p>
          <p className="font-bold">
            {Math.floor((stats?.uptime || 0) / 3600)}h
            {Math.floor(((stats?.uptime || 0) % 3600) / 60)}m
          </p>
        </div>
        <div>
          <p className="text-cyan-100">Temp</p>
          <p className={`font-bold ${statusColor}`}>{stats?.cpuTemp?.toFixed(1)}°C</p>
        </div>
      </div>
    </div>
  );
}
