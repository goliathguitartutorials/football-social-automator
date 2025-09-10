'use client';
import { useState } from 'react';
import styles from './SquadAnnouncement.module.css';
import { useAppData } from '@/hooks/useAppData'; // Import the new shared hook

export default function SquadAnnouncement({ authKey }) {
  // Use the new hook to get ALL app data. This is now the single source of truth.
  const { players, backgrounds, loading, error } = useAppData(authKey);

  // State for this component
  const [selectedPlayers, setSelectedPlayers] = useState(Array(16).fill(''));
  const [selectedBackground, setSelectedBackground] = useState('');
  const [homeTeamBadge, setHomeTeamBadge] = useState(''); // New field
  const [awayTeamBadge, setAwayTeamBadge] = useState(''); // New field
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  // We can add preview logic back in a later step if needed.

  const handlePlayerSelect = (index, value) => {
    const newSelectedPlayers = [...selectedPlayers];
    newSelectedPlayers[index] = value;
    setSelectedPlayers(newSelectedPlayers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authKey) {
        alert('Please enter your Authorization Key.');
        return;
    }
    if (!selectedBackground) {
        alert('Please select a background image.');
        return;
    }

    setIsSubmitting(true);
    
    // Filter out empty player slots and get their sponsor info
    const playersWithSponsors = selectedPlayers
      .filter(playerName => playerName)
      .map(playerName => {
        const playerObject = players.find(p => p.fullName === playerName);
        return { 
          fullName: playerName, 
          sponsor: playerObject ? playerObject.Sponsor : 'N/A' 
        };
      });

    const payload = {
        action: 'squad_announcement', // Action for the n8n workflow
        players: playersWithSponsors,
        background: selectedBackground,
        home_team_badge: homeTeamBadge, // Send the badge URLs
        away_team_badge: awayTeamBadge,
    };

    try {
        const response = await fetch('/api/trigger-workflow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Something went wrong');
        }

        const result = await response.json();
        console.log('Workflow triggered successfully:', result);
        alert('Squad announcement generation started! Check n8n for progress.');

    } catch (error) {
        console.error('Submission error:', error);
        alert(`Error: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (loading) return <p>Loading assets...</p>;
  if (error) return <p>Error loading assets: {error}</p>;
  if (!authKey) return <p>Please enter your Authorization Key in the sidebar to load assets.</p>;

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Squad Announcement</h2>

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
      
      {/* Note: The badges for Squad Announcement are not yet fully implemented in the n8n workflow.
          This UI is added now for consistency and future use. We will implement them fully next. */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Select Team Badges</h3>
        <p className={styles.notice}>Note: Badge selection is for future implementation.</p>
        <div className={styles.badgeGrid}>
            <div className={styles.formGroup}>
                <label>Home Team Badge</label>
                <input type="text" value={homeTeamBadge} onChange={(e) => setHomeTeamBadge(e.target.value)} placeholder="Enter home badge URL..." />
            </div>
            <div className={styles.formGroup}>
                <label>Away Team Badge</label>
                <input type="text" value={awayTeamBadge} onChange={(e) => setAwayTeamBadge(e.target.value)} placeholder="Enter away badge URL..." />
            </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Select a Background</h3>
        <div className={styles.backgroundGrid}>
          {backgrounds.map((bg) => (
            <div
              key={bg.Link}
              className={`${styles.backgroundItem} ${selectedBackground === bg.Link ? styles.selected : ''}`}
              onClick={() => setSelectedBackground(bg.Link)}
            >
              <img src={bg.Link} alt={bg.Name} />
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.actions}>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Generating...' : 'Generate Image'}
        </button>
      </div>
    </form>
  );
}
