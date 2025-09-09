'use client';
import { useState, useEffect } from 'react';
import styles from './SquadAnnouncement.module.css';

const VIEW_STATES = { CONFIG: 'CONFIG', PREVIEW: 'PREVIEW' };

// The component now accepts the authKey as a prop from its parent
export default function SquadAnnouncement({ authKey }) {
  const [players, setPlayers] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [dataIsLoading, setDataIsLoading] = useState(true);

  const [selectedPlayers, setSelectedPlayers] = useState(Array(16).fill(''));
  const [selectedBackground, setSelectedBackground] = useState('');
  const [customBackground, setCustomBackground] = useState(null);
  
  // The local password state is GONE
  // const [password, setPassword] = useState('');

  const [view, setView] = useState(VIEW_STATES.CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  // This hook now depends on `authKey`. It will re-run if the key changes.
  useEffect(() => {
    // Don't try to fetch data if the auth key is not entered
    if (!authKey) {
      setDataIsLoading(false);
      setPlayers([]); // Clear any old data
      setBackgrounds([]);
      return;
    }

    const fetchData = async () => {
      setDataIsLoading(true);
      setMessage('');
      setIsError(false);
      try {
        // We now use a POST request and send the key in the body
        const response = await fetch('/api/get-app-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authKey }),
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch initial data');
        
        setPlayers(data.players || []);
        setBackgrounds(data.backgrounds || []);

      } catch (error) {
        setMessage(`Error: ${error.message}`);
        setIsError(true);
      } finally {
        setDataIsLoading(false);
      }
    };
    fetchData();
  }, [authKey]); // The dependency array ensures this runs when authKey is typed

  const handleGeneratePreview = (e) => {
    e.preventDefault();
    console.log({
      selectedPlayers,
      selectedBackground,
      customBackground,
      authKey, // We use the authKey from props
    });
    setMessage('Preview generation logic is not yet implemented.');
  };

  const handlePlayerSelect = (index, value) => {
    const newSelectedPlayers = [...selectedPlayers];
    newSelectedPlayers[index] = value;
    setSelectedPlayers(newSelectedPlayers);
  };
  
  // --- RENDER LOGIC ---
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
        {/* Player Selection Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Select Players (1-16)</h3>
          <div className={styles.playerGrid}>
            {selectedPlayers.map((player, index) => (
              <select key={index} value={player} onChange={(e) => handlePlayerSelect(index, e.target.value)} className={styles.selectInput}>
                <option value="">Player {index + 1}</option>
                {players.map((p) => (<option key={p.id || p.name} value={p.name}>{p.name}</option>))}
              </select>
            ))}
          </div>
        </div>

        {/* Background Selection Section */}
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
        
        {/* The password input is GONE from here */}
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
