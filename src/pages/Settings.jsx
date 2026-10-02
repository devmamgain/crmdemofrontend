import { RefreshCw } from 'lucide-react';
import { getHealth } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { PageHeader, Badge, Skeleton } from '../components/ui.jsx';

export default function Settings() {
  const { data: h, loading, reload } = useFetch(getHealth);
  const rows = h && [
    ['API server', <Badge tone="green">Online</Badge>],
    ['MongoDB', <Badge tone={h.db.connected ? 'green' : 'red'}>{h.db.connected ? 'Connected' : 'Disconnected'}</Badge>],
    ['LLM', h.llm.configured ? <Badge tone="indigo">Live · {h.llm.model}</Badge> : <Badge tone="gray">Not configured — using deterministic fallback</Badge>],
    ['Comparable transactions', 'Seeded demo/historical dataset (not live prices)'],
    ['Recommended buy ratio', `${Math.round(h.fmv.buyRatio * 100)}% of FMV (FMV_BUY_RATIO)`],
    ['Estimated resale ratio', `${Math.round(h.fmv.resaleRatio * 100)}% of FMV (FMV_RESALE_RATIO)`],
    ['Server time', new Date(h.time).toLocaleString()],
  ];
  return (
    <>
      <PageHeader title="Settings & API status" description="Runtime configuration reported by the backend."
        actions={<button className="btn-secondary" onClick={() => reload()}><RefreshCw className="h-4 w-4" />Refresh</button>} />
      <div className="card max-w-2xl divide-y divide-slate-100">
        {loading ? <div className="space-y-3 p-5"><Skeleton className="h-5" /><Skeleton className="h-5" /><Skeleton className="h-5" /></div>
          : !h ? <p className="p-5 text-sm text-red-600">Cannot reach the API server.</p>
          : rows.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><span className="text-slate-500">{k}</span><span className="text-slate-900">{v}</span></div>)}
      </div>
      <p className="mt-4 max-w-2xl text-xs text-slate-500">Secrets (Mongo URI, LLM key) live only in <code>server/.env</code> and are never sent to the browser.</p>
    </>
  );
}
