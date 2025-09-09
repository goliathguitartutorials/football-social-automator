'use client';
import { useState, useEffect } from 'react';
import styles from './SquadAnnouncement.module.css';

const VIEW_STATES = { CONFIG: 'CONFIG', PREVIEW: 'PREVIEW' };

export default function SquadAnnouncement({ authKey }) {
  const [players, setPlayers] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [dataIsLoading, setDataIsLoading] = useState(true);

  // ... (other state variables remain the same)
  const [selectedPlayers, setSelectedPlayers] = useState(Array(16).fill(''));
  const [selectedBackground, setSelectedBackground] = useState('');
  const [customBackground, setCustomBackground] = useState(null);
  const [view, setView] = useState(VIEW_STATES.CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!authKey) {
      console.log("[EFFECT] No auth key provided. Skipping fetch.");
      setDataIsLoading(false);
      setPlayers([]);
      setBackgrounds([]);
      return;
    }

    const fetchData = async () => {
      setDataIsLoading(true);
      setMessage('');
      setIsError(false);
      console.log("[FETCH] Auth key is present. Attempting to fetch data...");

      try {
        const response = await fetch('/api/get-app-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authKey }),
        });

        const data = await response.json();
        
        // --- LOGGING POINT 1: RAW RESPONSE ---
        // Let's see exactly what we got back from our API before we do anything else.
        console.log("[FETCH] Raw data received from /api/get-app-data:", data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch initial data');
        }

        const playersData = data.players || data || [];
        
        // --- LOGGING POINT 2: PARSED PLAYERS ---
        // Let's see what the code thinks the player list is.
        console.log("[FETCH] Parsed playersData to be set in state:", playersData);
        
        setPlayers(playersData);
        setBackgrounds(data.backgrounds || []);

      } catch (error) {
        // --- LOGGING POINT 3: CATCHING ERRORS ---
        console.error("[FETCH] An error occurred:", error);
        setMessage(`Error: ${error.message}`);
        setIsError(true);
      } finally {
        setDataIsLoading(false);
      }
    };
    fetchData();
  }, [authKey]);

  // --- LOGGING POINT 4: COMPONENT RENDER ---
  // This will show us what the 'players' state is every time the component re-renders.
  console.log("[RENDER] Component is rendering. Current 'players' state:", players);
  
  // The rest of the file (handleGeneratePreview, handlePlayerSelect, JSX) remains the same...

  const handleGeneratePreview = (e) => {
    e.preventDefault();
    const playersWithSponsors = selectedPlayers.filter(name => name).map(name => {
      const playerObj = players.find(p => p.fullName === name);
      return { fullName: name, sponsor: playerObj ? playerObj.Sponsor : 'N/A' };
    });
    console.log("Data to be sent for image generation:", { playersWithSponsors, selectedBackground, customBackground, authKey });
    setMessage('Preview generation logic is not yet implemented. Check console.');
  };

  const handlePlayerSelect = (index, value) => {
    const newSelectedPlayers = [...selectedPlayers];
    newSelectedPlayers[index] = value;
    setSelectedPlayers(newSelectedPlayers);
  };

  let content;
  if (!authKey) {
    content = <p className={styles.notice}>Please enter the Authorization Key in the sidebar to load data.</p>;
  } else if (dataIsLoading) {
    content = <p className={styles.notice}>Loading player and background data...</p>;
  } else if (isError) {
    content = <p className={`${styles.notice} ${styles.error}`}>{message}</p>;
  } else {
    content = (
      <form onSubmit={handleGeneratePreview}>
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Select Players (1-16)</h3>
          <div className={styles.playerGrid}>
            {selectedPlayers.map((player, index) => (
              <select key={index} value={player} onChange={(e) => handlePlayerSelect(index, e.target.value)} className={styles.selectInput}>
                <option value="">Player {index + 1}</option>
                {players.map((p) => (<option key={p.row_number} value={p.fullName}>{p.fullName}</option>))}
              </select>
            ))}
          </div>
        </div>
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Select Background</h3>
          <select value={selectedBackground} onChange={(e) => setSelectedBackground(e.target.value)} className={styles.selectInput} disabled={!!customBackground}>
            <option value="">Choose a preset background</op
