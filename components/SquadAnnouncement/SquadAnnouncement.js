'use client';
import { useState } from 'react';
import styles from './SquadAnnouncement.module.css';
// MODIFIED: Corrected the import path to use the project's '@/' alias.
import { useAppContext } from '@/app/context/AppContext';

export default function SquadAnnouncement() {
  const { appData, authKey, loading, error } = useAppContext();
  const { players, backgrounds, badges } = appData;

  const [selectedPlayers, setSelectedPlayers] = useState(Array(16).fill(''));
  const [selectedBackground, setSelectedBackground] = useState('');
  const [homeTeamBadge, setHomeTeamBadge] = useState('');
  const [awayTeamBadge, setAwayTeamBadge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      action: 'squad_announcement',
      players: playersWithSponsors,
      background: selectedBackground,
      home_team_badge: homeTeamBadge,
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
  
  if (loading) return <p className={styles.notice}>Loading assets...</p>;
  if (error) return <p className={`${styles.notice} ${styles.error}`}>{error}</p>;
  if (players.length === 0) return <p className={styles.notice}>Please enter your Authorization Key on the Settings page to load assets.</p>;

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
      
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Select Team Badges</h3>
        <div className={styles.badgeGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="homeTeamBadge">Home Team Badge</label>
            <select id="homeTeamBadge" value={homeTeamBadge} onChange={(e) => setHomeTeamBadge(e.target.value)} required>
              <option value="">Select a badge...</option>
              {badges.map((badge) => (
                <option key={`home-${badge.Link}`} value={badge.Link}>{badge.Name.replace(/.png/i, '').substring(14)}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="awayTeamBadge">Away Team Badge</label>
            <select id="awayTeamBadge" value={awayTeamBadge} onChange={(e) => setAwayTeamBadge(e.target.value)} required>
              <option value="">Select a badge...</option>
              {badges.map((badge) => (
                <option key={`away-${badge.Link}`} value={badge.Link}>{badge.Name.replace(/.png/i, '').substring(14)}</option>
              ))}
            </select>
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
