import Hero from './Hero';
import Stats from './Stats';
import Health from './Health';

export default function Dashboard({ stats, isMining, onStart, onStop }: any) {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Monero Hunter v2</h1>
          <button
            onClick={isMining ? onStop : onStart}
            className={`px-4 py-2 rounded font-bold ${
              isMining
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isMining ? 'Stop' : 'Start'}
          </button>
        </div>

        {stats && (
          <>
            <Hero stats={stats} />
            <Stats stats={stats} />
            <Health stats={stats} />
          </>
        )}

        {!stats && (
          <div className="text-center py-12">
            <p className="text-slate-400">Initializing...</p>
          </div>
        )}
      </div>
    </div>
  );
}
