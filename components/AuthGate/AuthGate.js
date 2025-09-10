'use client';

import styles from './AuthGate.module.css';
import { useAppContext } from '../../app/context/AppContext';

export default function AuthGate() {
  const { error } = useAppContext();

  return (
    <div className={styles.gateContainer}>
      <div className={styles.gateBox}>
        <h2 className={styles.title}>Authentication Required</h2>
        {error ? (
          // If an error exists (e.g., wrong key), display it in red
          <p className={`${styles.message} ${styles.error}`}>
            {error}
          </p>
        ) : (
          // The default message when the user first visits
          <p className={styles.message}>
            Please enter your Authorization Key in the panel on the left to begin.
          </p>
        )}
      </div>
    </div>
  );
}
