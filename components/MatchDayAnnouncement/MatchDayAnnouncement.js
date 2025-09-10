'use client';
import styles from './MatchDayAnnouncement.module.css';

// Accept authKey prop for future use
export default function MatchDayAnnouncement({ authKey }) {
  return (
    <div className={styles.container}>
      <h2>Match Day Announcement</h2>
      <p>
        The form to collect match day details (badges, date, time, venue, background) will be built here.
      </p>
    </div>
  );
}
