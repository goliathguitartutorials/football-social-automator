'use client';
import { useState, useEffect } from 'react';
import styles from './SquadAnnouncement.module.css';

// Define the two main states for our component's UI
const VIEW_STATES = {
  CONFIG: 'CONFIG', // The user is configuring the post
  PREVIEW: 'PREVIEW', // The user is viewing the generated image
};

export default function SquadAnnouncement() {
  // State for the data we fetch from n8n
  const [players, setPlayers] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [dataIsLoading, setDataIsLoading] = useState(true);

  // State for the form inputs
  const [selectedPlayers, setSelectedPlayers] = useState(Array(16).fill(''));
  const [selectedBackground, setSelectedBackground] = useState('');
  const [customBackground, setCustomBackground] = useState(null);
  const [password, setPassword] = useState('');

  // State for the UI and workflow
  const [view, setView] = useState(VIEW_STATES.CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  // This useEffect hook runs once when the component loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/get-app-data');
        if (!response.ok) throw new Error('Failed to fetch initial data');
        const data = await response.json();

        // Assuming n8n returns { players: [...], backgrounds: [...] }
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
  }, []); // The empty array [] means this effect runs only once

  const handleGeneratePreview = (e) => {
    e.preventDefault();
    // Logic to call trigger-workflow API will go here
    // For now, we'll just log the data
    console.log({
      selectedPlayers,
      selectedBackground,
      customBackground,
      password,
    });
    // We would set isGenerating to true, make the API call,
    // then on success, setPreviewImage and change the view.
    setMessage('Preview generation logic is not yet implemented.');
  };

  const handlePlayerSelect = (index, value) => {
    const newSelectedPlayers = [...selectedPlayers];
    newSelectedPlayers[index] = value;
    setSelectedPlayers(newSelectedPlayers);
  };

  // RENDER THE CONFIGURATION VIEW
  if (view === VIEW_STATES.CONFIG) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Squad Announcement</h2>
        {dataIsLoading ? (
          <p>Loading player and background data...</p>
        ) : (
          <form onSubmit={handleGeneratePreview}>
            {/* Player Selection Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Select Players (1-16)</h3>
              <div className={styles.playerGrid}>
                {selectedPlayers.map((player, index) => (
                  <select
                    key={index}
                    value={player}
                    onChange={(e) => handlePlayerSelect(index, e.target.value)}
                    className={styles.selectInput}
                  >
                    <option value="">Player {index + 1}</option>
                    {players.map((p) => (
                      <option key={p.id || p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            {/* Background Selection Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Select Background</h3>
              <select
                value={selectedBackground}
                onChange={(e) => setSelectedBackground(e.target.value)}
                className={styles.selectInput}
                disabled={!!customBackground} // Disable if a custom bg is chosen
              >
                <option value="">Choose a preset background</option>
                {backgrounds.map((bg) => (
                  <option key={bg.id || bg.name} value={bg.url}>{bg.name}</option>
                ))}
              </select>
              <div className={styles.orSeparator}>OR</div>
              <label htmlFor="customBg" className={styles.label}>Upload a custom background</label>
              <input
                id="customBg"
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) => setCustomBackground(e.target.files[0])}
              />
            </div>
            
            {/* Authorization and Submission */}
            <div className={styles.formSection}>
              <label htmlFor="password" className={styles.label}>Authorization Key</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="Enter secret key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={isGenerating} className={styles.submitButton}>
                {isGenerating ? 'Generating...' : 'Generate Preview'}
              </button>
            </div>
          </form>
        )}
        {message && <p>{message}</p>}
      </div>
    );
  }

  // RENDER THE PREVIEW VIEW
  if (view === VIEW_STATES.PREVIEW) {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Preview & Confirm</h2>
            {/* Image will go here */}
            {/* Approve and Edit buttons will go here */}
        </div>
    )
  }
}
