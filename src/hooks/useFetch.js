import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

/** Small data-loading hook: { data, loading, error, reload, setData }. Ignores stale responses. */
export function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const run = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async ({ silent = false } = {}) => {
    const id = ++run.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (id === run.current) setData(result);
    } catch (e) {
      if (id === run.current) {
        setError(e.message);
        toast.error(e.message, { id: 'fetch-error' });
      }
    } finally {
      if (id === run.current) setLoading(false);
    }
  }, deps);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}
