'use client';
import { useState, useEffect } from 'react';
import styles from './SquadAnnouncement.module.css';

// ... (keep the VIEW_STATES constant)

export default function SquadAnnouncement({ authKey }) {
  // ... (keep all existing state variables)
  const [players, setPlayers] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [dataIsLoading, setDataIsLoading] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState(Array(16).fill(''));
  const [selectedBackground, setSelectedBackground] = useState('');
  const [customBackground, setCustomBackground] = useState(null);
  const [view, setView] = useState('CONFIG');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // ... (keep the useEffect for fetching data as is)
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


  // ... (keep handleGeneratePreview as is, it's already correct)
  const handleGeneratePreview = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setMessage('');
    setIsError(false);
    try {
      const playersWithSponsors = selectedPlayers
        .filter(playerName => playerName)
        .map(playerName => {
          const playerObject = players.find(p => p.fullName === playerName);
          return { fullName: playerName, sponsor: playerObject ? playerObject.Sponsor : 'N/A' };
        });
      const formData = new FormData();
      formData.append('authKey', authKey);
      formData.append('workflow', 'football-social-automator');
      const jsonData = {
        players: playersWithSponsors,
        background: selectedBackground,
      };
      formData.append('data', JSON.stringify(jsonData));
      if (customBackground) {
        formData.append('customBackground', customBackground, customBackground.name);
      }
      const response = await fetch('/api/trigger-workflow', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to generate preview.');
      }
      if (result.previewUrl) {
        setPreviewImage(result.previewUrl);
        setView('PREVIEW');
      } else {
        throw new Error('Workflow did not return a preview image URL.');
      }
    } catch (error) {
      setMessage(`Error: ${error.message}. Check the console for more details.`);
      setIsError(true);
    } finally {
      setIsGenerating(false);
    }
  };


  // ... (keep handlePlayerSelect and handleBackToEdit as is)
  const handlePlayerSelect = (index, value) => {
    const newSelectedPlayers = [...selectedPlayers];
    newSelectedPlayers[index] = value;
    setSelectedPlayers(newSelectedPlayers);
  };
  const handleBackToEdit = () => {
    setView('CONFIG');
    setPreviewImage(null);
    setMessage('');
    setIsError(false);
  };

  // NEW: Handler to clear the selected file
  const handleRemoveFile = () => {
    setCustomBackground(null);
    // Also reset the file input visually
    const fileInput = document.getElementById('customBg');
    if(fileInput) fileInput.value = '';
  };


  let content;

  // ... (keep the `if (view === 'PREVIEW')` block as is)
  if (view === 'PREVIEW') {
    content = (
      <div className={styles.previewContainer}>
        <h3 className={styles.sectionTitle}>Generated Preview</h3>
        {previewImage && <img src={previewImage} alt="Generated Squad Announcement" className={styles.previewImage} />}
        <div className={styles.previewActions}>
            <button onClick={handleBackToEdit} className={styles.backButton}>Back to Edit</button>
            <button className={styles.submitButton} disabled>Approve & Post</button>
        </div>
      </div>
    );
  } else {
    // ... (keep the start of the CONFIG view logic as is)
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
          {/* Player Selection Section is unchanged */}
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

          {/* Background Selection Section is updated */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Select Background</h3>
            <select value={selectedBackground} onChange={(e) => setSelectedBackground(e.target.value)} className={styles.selectInput} disabled={!!customBackground}>
              <option value="">Choose a preset background</option>
              {backgrounds.map((bg) => (<option key={bg.id || bg.name} value={bg.url}>{bg.name}</option>))}
            </select>
            <div className={styles.orSeparator}>OR</div>
            <label htmlFor="customBg" className={styles.label}>Upload a custom background</label>
            <input id="customBg" type="file" accept="image/*" className={styles.fileInput} onChange={(e) => setCustomBackground(e.target.files[0])}/>
            
            {/* NEW: Visual feedback for the selected file */}
            {customBackground && (
              <div className={styles.filePreview}>
                <span>{customBackground.name}</span>
                <button type="button" onClick={handleRemoveFile} className={styles.removeFileButton}>
                  &times;
                </button>
              </div>
            )}
          </div>

          {/* Form Submission Section is unchanged */}
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


  // ... (keep the final return statement as is)
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Squad Announcement</h2>
      {content}
    </div>
  );
}
