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
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch initial data');
        }

        setPlayers(data.players || data || []);
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

  const handleGeneratePreview = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setMessage('');
    setIsError(false);

    try {
      const playersWithSponsors = selectedPlayers
        .filter(playerName => playerName) // Remove empty selections
        .map(playerName => {
          const playerObject = players.find(p => p.fullName === playerName);
          return {
            fullName: playerName,
            sponsor: playerObject ? playerObject.Sponsor : 'N/A'
          };
        });

      // Construct the payload to send to our API route
      const payload = {
        authKey,
        workflow: 'football-social-automator', // Specify the target n8n workflow
        data: {
          players: playersWithSponsors,
          background: selectedBackground,
          // Note: Custom background handling would require file upload logic here
        }
      };

      const response = await fetch('/api/trigger-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to generate preview.');
      }

      // Assuming the n8n workflow returns a URL for the generated image [cite: 45]
      if (result.previewUrl) {
        setPreviewImage(result.previewUrl);
        setView(VIEW_STATES.PREVIEW);
      } else {
        throw new Error('Workflow did not return a preview image URL.');
      }

    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setIsError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayerSelect = (index, value) => {
    const newSelectedPlayers = [...selectedPlayers];
    newSelectedPlayers[index] = value;
    setSelectedPlayers(newSelectedPlayers);
  };

  // Handler to return to the editing form from the preview
  const handleBackToEdit = () => {
    setView(VIEW_STATES.CONFIG);
    setPreviewImage(null);
    setMessage('');
    setIsError(false);
  };

  let content;

  if (view === VIEW_STATES.PREVIEW) {
    content = (
      <div className={styles.previewContainer}>
        <h3 className={styles.sectionTitle}>Generated Preview</h3>
        {previewImage && <img src={previewImage} alt="Generated Squad Announcement" className={styles.previewImage} />}
        <div className={styles.previewActions}>
            <button onClick={handleBackToEdit} className={styles.backButton}>Back to Edit</button>
            {/* The "Approve & Post" button will be implemented in a future step */}
            <button className={styles.submitButton} disabled>Approve & Post</button>
        </div>
      </div>
    );
  } else {
    // This is the CONFIG view content
    if (!authKey) {
      content = <p className={styles.notice}>Please enter the Authorization Key in the sidebar to load data.</p>;
    } else if (dataIsLoading) {
      content = <p className={styles.notice}>Loading player and background data...</p>;
    } else if (isError && !isGenerating) {
        content = (
            <div>
                <p className={`${styles.notice} ${styles.error}`}>{message}</p>
                <button onClick={() => window.location.reload()} className={styles.backButton}>Refresh Page</button>
            </div>
        );
    } else {
      content = (
        <form onSubmit={handleGeneratePreview}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Select Players (1-16)</h3>
            <div className={styles.playerGrid}>
              {selectedPlayers.map((player, index) => (
                <select key={index} value={player} onChange={(e) => handlePlayerSelect(index, e.target.value)} className={styles.selectInput}>
                  <option value="">Player {index + 1}</option>
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
            <input id="customBg" type="file" accept="image/*" className={styles.fileInput} onChange={(e) => setCustomBackground(e.target.files[0])} disabled/>
          </div>

          <div className={styles.formSection}>
            <button type="submit" disabled={isGenerating} className={styles.submitButton}>
              {isGenerating ? 'Generating...' : 'Generate Preview'}
            </button>
            {isError && <p className={`${styles.notice} ${styles.error}`}>{message}</p>}
          </div>
        </form>
      );
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Squad Announcement</h2>
      {content}
    </div>
  );
}
