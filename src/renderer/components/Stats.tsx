export default function Stats({ stats }: any) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-bold text-slate-400 mb-3">SHARES</h3>
        <p className="text-2xl font-bold text-green-400">{stats?.shares?.accepted || 0}</p>
        <p className="text-xs text-slate-500">accepted</p>
        <p className="text-xs text-slate-500 mt-1">
          {stats?.shares?.rejected || 0} rejected
        </p>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-bold text-slate-400 mb-3">NET PROFIT</h3>
        <p className={`text-2xl font-bold ${stats?.netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
          ${stats?.netProfit?.toFixed(4)}
        </p>
        <p className="text-xs text-slate-500">after electricity</p>
      </div>
    </div>
  );
}
