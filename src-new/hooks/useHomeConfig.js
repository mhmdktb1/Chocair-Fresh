import { useEffect, useState } from 'react';
import api from '../utils/api';

const CACHE_KEY = 'homeConfigCache';

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** CMS home config (story, delivery settings...) with the same localStorage cache the homepage uses. */
export const useHomeConfig = () => {
  const [config, setConfig] = useState(readCache);

  useEffect(() => {
    let cancelled = false;
    api.get('/home-config')
      .then((res) => {
        if (cancelled || !res?.data) return;
        setConfig(res.data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
        } catch {
          // storage unavailable
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
};
