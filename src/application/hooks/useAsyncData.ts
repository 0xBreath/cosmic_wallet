// returns [data, loaded, error]
// loaded is false when error is present for backwards compatibility
import { useEffect, useReducer } from "react";
import { AsyncDataResult, CacheKeyProps, CacheListener } from "../../shared";
import { CacheModel } from "../../core";

/// TODO: move to CacheModel
export function useAsyncData<T = any>(
  fn: () => Promise<T>,
  cacheKeyProps: CacheKeyProps,
  { refreshInterval = 60000 } = {},
): AsyncDataResult<T> {
  const cacheModel = CacheModel.instance;

  const [, rerender] = useReducer((i) => i + 1, 0);
  const cacheKey = JSON.stringify(cacheKeyProps);

  useEffect(() => {
    if (!cacheKey) {
      return;
    }
    const listener: CacheListener<T> = {
      cacheKey,
      fn,
      refreshInterval,
      callback: rerender,
    };
    cacheModel.addListener(listener);
    return () => cacheModel.removeListener(listener);
  }, [cacheKey, refreshInterval]);

  if (!cacheKey) {
    return {
      data: null,
      loaded: false,
      error: undefined,
    };
  }

  const loaded = cacheModel.GlobalCache.has(cacheKey);
  const error = cacheModel.ErrorCache.has(cacheKey)
    ? cacheModel.ErrorCache.get(cacheKey)
    : undefined;
  const data = loaded ? cacheModel.GlobalCache.get(cacheKey) : undefined;
  return {
    data,
    loaded,
    error,
  };
}
