import { Check } from 'lucide-react';

const STEPS = [
  ['Client asset inventory', 'Spreadsheet from the client'],
  ['Excel upload', 'Processed on the server'],
  ['Asset normalization', 'Models cleaned and matched'],
  ['Comparable transactions', 'Demo historical sales'],
  ['Estimated FMV', 'Median × condition grade'],
  ['Total recovery value', 'FMV × quantity'],
  ['Recommended buy price', 'Share of FMV'],
  ['Estimated resale value', 'Expected realization'],
  ['Margin', 'Resale − buy price'],
];

/** doneCount = number of completed steps; `active` highlights the step currently running. */
export default function ValuationWorkflow({ doneCount = 0, activeFrom = null, activeTo = null }) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-9" aria-label="Valuation workflow">
      {STEPS.map(([title, sub], i) => {
        const done = i < doneCount;
        const active = !done && activeFrom !== null && i >= activeFrom && i <= activeTo;
        return (
          <li key={title} className={`rounded-lg border px-3 py-2 ${done ? 'border-emerald-200 bg-emerald-50' : active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center gap-2">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${done ? 'bg-emerald-500 text-white' : active ? 'animate-pulse bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {done ? <Check className="h-3 w-3" aria-hidden="true" /> : i + 1}
              </span>
              <span className="text-[11px] font-semibold leading-tight text-slate-800">{title}</span>
            </div>
            <p className="mt-1 pl-7 text-[10px] leading-tight text-slate-500">{sub}</p>
          </li>
        );
      })}
    </ol>
  );
}
