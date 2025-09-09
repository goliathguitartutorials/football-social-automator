'use client';

import { useState } from 'react';
import styles from './page.module.css'; // Import our custom styles

export default function HomePage() {
  const [playerList, setPlayerList] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch('/api/trigger-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postType: 'squad_announcement',
          players: playerList,
          password: password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      setMessage('Success! The workflow has been triggered.');
      setIsError(false);
      setPlayerList(''); // Clear the textarea

    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Social Media Post Automator</h1>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="playerList" className={styles.label}>
              Squad Announcement: Player List
            </label>
            <textarea
              id="playerList"
              name="playerList"
              className={styles.textarea}
              placeholder="Enter each player's full name on a new line..."
              value={playerList}
              onChange={(e) => setPlayerList(e.target.value)}
              required
            ></textarea>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Authorization Key
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.input}
              placeholder="Enter your secret key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Triggering...' : 'Generate Squad Post'}
          </button>
        </form>

        {message && (
          <p className={`${styles.message} ${isError ? styles.error : styles.success}`}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
