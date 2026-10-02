import { useRef, useState, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, Download, History, X, Database, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeFMV, getFMVHistory, getFMVAnalysis, getMarketData, sampleFileUrl } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { PageHeader, EmptyState, Spinner, TableSkeleton } from '../components/ui.jsx';
import FmvResult from '../components/FmvResult.jsx';
import AddMarketDataModal from '../components/AddMarketDataModal.jsx';
import ValuationWorkflow from '../components/ValuationWorkflow.jsx';
import { money, dateShort } from '../utils/format.js';

const SAMPLES = [['sample-inventory.xlsx', 'Enterprise device refresh'], ['sample-datacenter-decommission.xlsx', 'Data center decommission'], ['sample-inventory-with-unknown.xlsx', 'Messy list with unknown models']];

function ComparableDataset({ refreshKey }) {
  const [open, setOpen] = useState(false);
  const { data, loading } = useFetch(() => (open ? getMarketData() : Promise.resolve(null)), [open, refreshKey]);
  return (
    <section className="card mt-6 overflow-hidden" aria-label="Comparable transaction dataset">
      <button className="flex w-full items-center justify-between px-5 py-4 text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Database className="h-4 w-4 text-slate-500" aria-hidden="true" />Comparable transaction dataset <span className="font-normal text-slate-500">· demo / historical</span></span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (loading || !data ? <TableSkeleton rows={4} cols={5} /> : (
        <div className="overflow-x-auto border-t border-slate-200"><table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50"><tr>{['Model', 'Category', 'Comparables', 'Price range', 'Median (Good)', 'Source'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{data.map((m) => (
            <tr key={m._id}><td className="td font-medium text-slate-900">{m.model}</td><td className="td">{m.category}</td><td className="td">{m.marketPrices.length}</td>
              <td className="td whitespace-nowrap">{money(Math.min(...m.marketPrices))}–{money(Math.max(...m.marketPrices))}</td><td className="td">{money(m.currentFMV)}</td>
              <td className="td text-xs text-slate-500">{m.sourceType === 'user_supplied' ? 'User supplied' : 'Demo historical'}</td></tr>))}</tbody></table></div>
      ))}
    </section>
  );
}

const ACCEPT = '.xlsx,.xls,.csv';

export default function FairMarketValue() {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('Analyzing spreadsheet…');
  const [analysis, setAnalysis] = useState(null);
  const [mdModel, setMdModel] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [mdVersion, setMdVersion] = useState(0);
  const { data: history, loading: histLoading, reload: reloadHistory } = useFetch(getFMVHistory);

  // Server does parsing, valuation and AI insights in one request; switch the label to reflect progress.
  useEffect(() => {
    if (!busy) return undefined;
    setPhase('Analyzing spreadsheet…');
    const t = setTimeout(() => setPhase('Generating AI insights…'), 1500);
    return () => clearTimeout(t);
  }, [busy]);

  function pick(f) {
    if (!f) return;
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) return toast.error('Only .xlsx, .xls or .csv files are accepted');
    if (f.size > 10 * 1024 * 1024) return toast.error('File is too large (10 MB maximum)');
    setFile(f);
  }

  async function run(f = file) {
    if (!f) return;
    setBusy(true);
    try {
      const result = await analyzeFMV(f);
      setAnalysis(result);
      toast.success('Analysis complete');
      reloadHistory({ silent: true });
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }

  async function openHistory(id) {
    setLoadingId(id);
    try { setAnalysis(await getFMVAnalysis(id)); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { toast.error(e.message); } finally { setLoadingId(null); }
  }

  return (
    <>
      <PageHeader title="Asset Valuation (FMV)" description="Turn a client's IT asset inventory into an estimated recovery value, buy price, resale value and margin." />

      <div className="mb-6"><ValuationWorkflow doneCount={analysis ? 9 : file ? 2 : 0} activeFrom={busy ? 2 : null} activeTo={busy ? 8 : null} /></div>

      <div className="card p-5">
        <div role="button" tabIndex={0} aria-label="Upload inventory spreadsheet"
          onClick={() => !busy && input.current?.click()} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !busy && input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
          className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}>
          <UploadCloud className="h-9 w-9 text-slate-400" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-900">Upload client asset inventory</p>
          <p className="mt-1 text-sm text-slate-500">Drag and drop, or <span className="font-medium text-brand-600">browse</span></p>
          <p className="mt-2 text-xs text-slate-400">Accepted: .xlsx, .xls, .csv · up to 10 MB · columns: Model Number, Quantity (Category, Condition optional)</p>
          <input ref={input} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Try a sample client inventory:</span>
          {SAMPLES.map(([name, label]) => <a key={name} className="inline-flex items-center gap-1 text-brand-600 hover:underline" href={sampleFileUrl(name)}><Download className="h-3 w-3" aria-hidden="true" />{label}</a>)}
        </div>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">Comparable market transactions are a <b>seeded demo/historical dataset</b>, not live market prices. All valuation numbers are calculated by the backend; AI only explains them.</p>

        {file && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3 text-sm"><FileSpreadsheet className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <div><p className="font-medium text-slate-900">{file.name}</p><p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB{analysis?.summary?.rowsParsed ? ` · ${analysis.summary.rowsParsed} rows` : ''}</p></div></div>
            <div className="flex gap-2">
              <button className="btn-ghost !px-2" onClick={() => setFile(null)} disabled={busy} aria-label="Remove file"><X className="h-4 w-4" /></button>
              <button className="btn-primary" onClick={() => run()} disabled={busy}>{busy && <Spinner />}{busy ? phase : 'Run valuation'}</button>
            </div>
          </div>
        )}
      </div>

      {analysis && (
        <section className="mt-6" aria-label="Analysis results">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900">Valuation results · {analysis.filename}</h2>
            <button className="btn-ghost" onClick={() => setAnalysis(null)}>Clear</button></div>
          <FmvResult analysis={analysis} onAddMarketData={setMdModel} onRerun={file ? () => run() : undefined} rerunning={busy} />
        </section>
      )}

      <section className="card mt-6 overflow-hidden" aria-label="Recent analyses">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4"><History className="h-4 w-4 text-slate-500" aria-hidden="true" /><h2 className="text-sm font-semibold text-slate-900">Recent valuations</h2></div>
        {histLoading ? <TableSkeleton rows={3} cols={5} /> : !history?.length ? (
          <EmptyState icon={FileSpreadsheet} title="No valuations yet" description="Run a valuation above — completed analyses are saved here." />
        ) : (
          <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50"><tr>{['Client inventory file', 'Assets', 'Recovery value', 'Buy price', 'Est. margin', 'Date'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h._id} tabIndex={0} className="cursor-pointer hover:bg-slate-50" onClick={() => openHistory(h._id)} onKeyDown={(e) => e.key === 'Enter' && openHistory(h._id)}>
                  <td className="td font-medium text-slate-900">{loadingId === h._id && <Spinner className="mr-2 h-3 w-3" />}{h.filename}</td>
                  <td className="td">{h.totalQuantity?.toLocaleString()}</td><td className="td">{money(h.estimatedMarketValue)}</td><td className="td">{money(h.recommendedBuyValue)}</td>
                  <td className="td text-emerald-700">{money(h.potentialMargin)}</td><td className="td whitespace-nowrap">{dateShort(h.createdAt)}</td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </section>

      <ComparableDataset refreshKey={mdVersion} />

      <AddMarketDataModal open={Boolean(mdModel)} model={mdModel} onClose={() => setMdModel(null)} onSaved={() => { setMdModel(null); setMdVersion((v) => v + 1); }} />
    </>
  );
}
