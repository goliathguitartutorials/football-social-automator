'use client';
import { useState, useEffect } from 'react';
import styles from './SquadAnnouncement.module.css';

const VIEW_STATES = { CONFIG: 'CONFIG', PREVIEW: 'PREVIEW' };

export default function SquadAnnouncement({ authKey }) {
  // State for the raw data from n8n
  const [players, setPlayers] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [dataIsLoading, setDataIsLoading] = useState(true);

  // State for the user's selections in the form
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
      setDataIsLoading(false);
      setPlayers([]);
      setBackgrounds([]);
      return;
    }

    const fetchData = async () => {
      setDataIsLoading(true);
      setMessage('');
      setIsError(false);
      try {
        const response = await fetch('/api/get-app-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authKey }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch initial data');

        // --- CHANGE HERE ---
        // We now expect the raw array of player objects directly from n8n.
        // For robustness, it's better if n8n returns { players: [...] }.
        // This code handles both cases.
        setPlayers(data.players || data || []);

        // We'll keep this for when you add backgrounds to the n8n response
        setBackgrounds(data.backgrounds || []);

      } catch (error) {
        setMessage(`Error: ${error.message}`);
        setIsError(true);
      } finally {
        setDataIsLoading(false);
      }
    };
    fetchData();
  }, [authKey]);

  const handleGeneratePreview = (e) => {
    e.preventDefault();

    // --- NEW LOGIC HERE ---
    // This is how we re-connect the selected player names with their sponsor data.
    const playersWithSponsors = selectedPlayers
      .filter(playerName => playerName) // Filter out any empty/unselected slots
      .map(playerName => {
        // Find the full player object from our state that matches the selected name
        const playerObject = players.find(p => p.fullName === playerName);
        return {
          fullName: playerName,
          sponsor: playerObject ? playerObject.Sponsor : 'N/A' // Return the player and their sponsor
        };
      });

    console.log("Data to be sent for image generation:", {
      playersWithSponsors, // This array now includes sponsor info
      selectedBackground,
      customBackground,
      authKey,
    });
    setMessage('Preview generation logic is not yet implemented. Check the browser console (F12) to see the prepared data.');
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
                {/* --- CHANGE HERE --- */}
                {/* We now map over the player data using the correct keys: row_number and fullName */}
                {players.map((p) => (
                  <option key={p.row_number} value={p.fullName}>{p.fullName}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Select Background</h3>
          <select value={selectedBackground} onChange={(e) => setSelectedBackground(e.target.value)} className={styles.selectInput} disabled={!!customBackground}>
            <option value="">Choose a preset background</option>
            {backgrounds.map((bg) => (<option key={bg.id || bg.name} value={bg.url}>{bg.name}</option>))}
          </select>
          <div className={styles.orSeparator}>OR</div>
          <label htmlFor="customBg" className={styles.label}>Upload a custom background</label>
          <input id="customBg" type="file" accept="image/*" className={styles.fileInput} onChange={(e) => setCustomBackground(e.target.files[0])}/>
        </div>

        <div className={styles.formSection}>
          <button type="submit" disabled={isGenerating} className={styles.submitButton}>
            {isGenerating ? 'Generating...' : 'Generate Preview'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Squad Announcement</h2>
      {content}
    </div>
  );
}
