'use client';
import { useState } from 'react';
import styles from './MatchDayAnnouncement.module.css';
// MODIFIED: We now import our global context hook instead of the old one.
import { useAppContext } from '../../context/AppContext'; 

// MODIFIED: The component no longer accepts any props.
export default function MatchDayAnnouncement() {
  // MODIFIED: We get all our data and the authKey directly from the global context.
  const { appData, authKey, loading, error } = useAppContext();
  const { backgrounds, badges } = appData; // Destructure the data object

  // --- All the component's internal state remains the same ---
  const [view, setView] = useState('CONFIG');
  const [homeTeamBadge, setHomeTeamBadge] = useState('');
  const [awayTeamBadge, setAwayTeamBadge] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [kickOffTime, setKickOffTime] = useState('');
  const [venue, setVenue] = useState('');
  const [selectedBackground, setSelectedBackground] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState('');

  // --- No changes needed in your handler functions, they will now use the authKey from the context ---
  const handleGeneratePreview = async (event) => {
    event.preventDefault();
    if (!authKey) { alert('Please enter your Authorization Key.'); return; }
    if (!selectedBackground) { alert('Please select a background image.'); return; }

    setIsSubmitting(true);
    setMessage('');

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

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to generate preview.');

      const imageUrl = result[0]?.data?.data?.content;
      if (!imageUrl) {
        throw new Error("Image URL not found in the API response.");
      }
      
      setPreviewUrl(imageUrl);
      setView('PREVIEW');

    } catch (error) {
      setMessage(`Error: ${error.message}`);
      console.error('Preview Generation Error:', error);
      setView('CONFIG');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostToSocial = async () => {
    setIsSubmitting(true);
    setMessage('');
    
    const payload = {
      action: 'post_image',
      imageUrl: previewUrl,
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
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to post to social media.');
      
      setMessage('Successfully posted to social media!');
      
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      console.error('Post to Social Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToEdit = () => {
    setView('CONFIG');
    setPreviewUrl('');
    setMessage('');
  };

  // MODIFIED: This section now correctly reflects the context's state.
  if (loading) return <p className={styles.notice}>Loading assets...</p>;
  if (error) return <p className={`${styles.notice} ${styles.error}`}>{error}</p>;
  // This check is now more robust. If there are no badges, it means data isn't loaded.
  if (badges.length === 0) return <p className={styles.notice}>Please enter your Authorization Key in the sidebar to load assets.</p>;

  // --- No changes needed for the component's return JSX ---
  if (view === 'PREVIEW') {
    return (
      <div className={styles.previewContainer}>
        <h2>Preview</h2>
        {previewUrl ? <img src={previewUrl} alt="Generated match day announcement" className={styles.previewImage} /> : <p>Loading preview...</p>}
        <div className={styles.previewActions}>
          <button onClick={handleBackToEdit} className={styles.backButton}>Back to Edit</button>
          <button onClick={handlePostToSocial} disabled={isSubmitting} className={styles.postButton}>
            {isSubmitting ? 'Posting...' : 'Post to Social Media'}
          </button>
        </div>
        {message && <p className={styles.message}>{message}</p>}
      </div>
    );
  }

  return (
    <form className={styles.container} onSubmit={handleGeneratePreview}>
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
          {isSubmitting ? 'Generating...' : 'Generate Preview'}
        </button>
      </div>
        {message && <p className={styles.message}>{message}</p>}
    </form>
  );
}
