'use client';
import { useState } from 'react';
import styles from './SquadAnnouncement.module.css';

export default function SquadAnnouncement() {
  const [playerList, setPlayerList] = useState('');
  const [squadImage, setSquadImage] = useState(null);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    setSquadImage(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!playerList && !squadImage) {
      setMessage('Error: Please provide a player list or upload an image.');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage('');
    setIsError(false);

    // We use FormData to send both text and files
    const formData = new FormData();
    formData.append('postType', 'squad_announcement');
    formData.append('password', password);
    formData.append('playerList', playerList);
    if (squadImage) {
      formData.append('image', squadImage);
    }

    try {
      // Note: We don't set Content-Type header, the browser does it for FormData
      const response = await fetch('/api/trigger-workflow', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setMessage('Success! Workflow triggered.');
      setIsError(false);
      setPlayerList('');
      setSquadImage(null);
      event.target.reset(); // Reset the form fields

    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Create Squad Announcement</h2>
      <form onSubmit={handleSubmit}>
        <p className={styles.instructions}>
          Provide the squad list in one of two ways:
        </p>
        
        {/* Method 1: Text Area */}
        <div className={styles.formGroup}>
          <label htmlFor="playerList" className={styles.label}>
            Method 1: Paste Player List
          </label>
          <textarea
            id="playerList"
            className={styles.textarea}
            placeholder="Enter each player's full name on a new line..."
            value={playerList}
            onChange={(e) => setPlayerList(e.target.value)}
          ></textarea>
        </div>

        <div className={styles.orSeparator}>OR</div>

        {/* Method 2: File Upload */}
        <div className={styles.formGroup}>
          <label htmlFor="squadImage" className={styles.label}>
            Method 2: Upload Screenshot
          </label>
          <input
            id="squadImage"
            type="file"
            accept="image/png, image/jpeg"
            className={styles.fileInput}
            onChange={handleFileChange}
          />
        </div>

        {/* Password and Submit */}
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            Authorization Key
          </label>
          <input
            id="password"
            type="password"
            className={styles.input}
            placeholder="Enter your secret key"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={isLoading} className={styles.submitButton}>
          {isLoading ? 'Triggering...' : 'Generate Squad Post'}
        </button>
      </form>

      {message && (
        <p className={`${styles.message} ${isError ? styles.error : styles.success}`}>
          {message}
        </p>
      )}
    </div>
  );
}
