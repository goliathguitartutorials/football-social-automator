'use client';
import { useState, useEffect } from 'react';

export function useAppData() {
  const [data, setData] = useState({
    players: [],
    backgrounds: [],
    badges: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      // 1. Check session storage first
      const cachedData = sessionStorage.getItem('appData');
      if (cachedData) {
        processData(JSON.parse(cachedData));
        setLoading(false);
        return;
      }

      // 2. If no cache, fetch from the API
      try {
        const response = await fetch('/api/get-app-data');
        if (!response.ok) {
          throw new Error('Failed to fetch app data');
        }
        const rawData = await response.json();

        // 3. Process and save to session storage
        processData(rawData);
        sessionStorage.setItem('appData', JSON.stringify(rawData));
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    function processData(rawData) {
      const players = rawData.filter((item) => item.class === 'player');
      const assets = rawData.filter((item) => item.class === 'asset');
      
      const backgrounds = assets.filter((asset) => asset.Type === 'background');
      const badges = assets.filter((asset) => asset.Type === 'badge');

      // Sort badges alphabetically by name
      badges.sort((a, b) => a.Name.localeCompare(b.Name));
      
      setData({ players, backgrounds, badges });
    }

    fetchData();
  }, []);

  return { ...data, loading, error };
}
