'use client';
import { useState } from 'react';
import styles from './MatchDayAnnouncement.module.css';
import { useAppData } from '@/hooks/useAppData';

export default function MatchDayAnnouncement({ authKey }) {
  // Pass the authKey prop into our hook
  const { backgrounds, badges, loading, error } = useAppData(authKey);

  // Form state
  const [homeTeamBadge, setHomeTeamBadge] = useState('');
  const [awayTeamBadge, setAwayTeamBadge] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [kickOffTime, setKickOffTime] = useState('');
  const [venue, setVenue] = useState('');
  const [selectedBackground, setSelectedBackground] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!authKey) {
      alert('Please enter your Authorization Key.');
      return;
    }
    if (!selectedBackground) {
      alert('Please select a background image.');
      return;
    }
    setIsSubmitting(true);
    const payload = {
      action: 'match_day_announcement',
      home_team_badge: homeTeamBadge,
      away_team_badge: awayTeamBadge,
      match_date: matchDate,
      kick_off_time: kickOffTime,
      venue: venue,
      background: selectedBackground,
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
      alert('Image generation started successfully! Check n8n for progress.');
    } catch (error) {
      console.error('Submission error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Improved loading/error states
  if (loading) return <p>Loading assets...</p>;
  if (error) return <p>Error loading assets: {error}</p>;
  if (!authKey) return <p>Please enter your Authorization Key in the sidebar to load assets.</p>;

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <h2>Match Day Announcement</h2>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="homeTeamBadge">Home Team Badge</label>
          <select id="homeTeamBadge" value={homeTeamBadge} onChange={(e) => setHomeTeamBadge(e.target.value)} required>
            <option value="">Select a badge...</option>
            {badges.map((badge) => (
              <option key={badge.Link} value={badge.Link}>{badge.Name.replace(/.png/i, '').substring(14)}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="awayTeamBadge">Away Team Badge</label>
          <select id="awayTeamBadge" value={awayTeamBadge} onChange={(e) => setAwayTeamBadge(e.target.value)} required>
            <option value="">Select a badge...</option>
            {badges.map((badge) => (
              <option key={badge.Link} value={badge.Link}>{badge.Name.replace(/.png/i, '').substring(14)}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="matchDate">Match Date</label>
          <input type="date" id="matchDate" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="kickOffTime">Kick-off Time</label>
          <input type="time" id="kickOffTime" value={kickOffTime} onChange={(e) => setKickOffTime(e.target.value)} required />
        </div>
        <div className={styles.formGroupFull}>
          <label htmlFor="venue">Venue</label>
          <input type="text" id="venue" placeholder="e.g., Cae Llan" value={venue} onChange={(e) => setVenue(e.target.value)} required />
        </div>
      </div>
      <div className={styles.backgroundSelector}>
        <h3 className={styles.selectorTitle}>Select a Background</h3>
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
