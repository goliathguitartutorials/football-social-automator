'use client';
import { useState, useEffect } from 'react';

// The hook now accepts the authKey as an argument
export function useAppData(authKey) {
  const [data, setData] = useState({
    players: [],
    backgrounds: [],
    badges: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Do not fetch if the auth key isn't provided yet.
    if (!authKey) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      const cachedData = sessionStorage.getItem('appData');
      if (cachedData) {
        processData(JSON.parse(cachedData));
        setLoading(false);
        return;
      }

      try {
        // --- MODIFIED FETCH CALL ---
        // Use the POST method and send the authKey in the body
        const response = await fetch('/api/get-app-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ authKey }),
        });
        // --- END MODIFICATION ---

        if (response.status === 401) {
          throw new Error('Authorization failed. Please check your key.');
        }
        if (!response.ok) {
          throw new Error('Failed to fetch app data from the server.');
        }

        const rawData = await response.json();
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

      badges.sort((a, b) => a.Name.localeCompare(b.Name));
      
      setData({ players, backgrounds, badges });
    }

    fetchData();
    // Re-run the effect if the authKey changes
  }, [authKey]);

  return { ...data, loading, error };
}
