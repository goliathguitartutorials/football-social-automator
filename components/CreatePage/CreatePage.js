/*
 * =================================================================
 * COMPONENT: Create Page
 * PAGE: /
 * FILE: /components/CreatePage/CreatePage.js
 * =================================================================
 */
'use client';

import { useState } from 'react';
import styles from './CreatePage.module.css';

import MatchDayAnnouncement from '@/components/MatchDayAnnouncement/MatchDayAnnouncement';
import SquadAnnouncement from '@/components/SquadAnnouncement/SquadAnnouncement';
import MatchResult from '@/components/MatchResult/MatchResult';

const postTypes = [
  { id: 'matchDay', label: 'Match Day' },
  { id: 'squad', label: 'Squad' },
  { id: 'result', label: 'Result' },
];

const PostTypeContent = ({ activePostType }) => {
  switch (activePostType) {
    case 'matchDay':
      return <MatchDayAnnouncement />;
    case 'squad':
      return <SquadAnnouncement />;
    case 'result':
      return <MatchResult />;
    default:
      return <MatchDayAnnouncement />;
  }
};

export default function CreatePage() {
  const [activePostType, setActivePostType] = useState('matchDay');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Create a New Post</h2>
        <nav className={styles.subNav}>
          {postTypes.map((type) => (
            <button
              key={type.id}
              className={`${styles.navButton} ${activePostType === type.id ? styles.active : ''}`}
              onClick={() => setActivePostType(type.id)}
            >
              {type.label}
            </button>
          ))}
        </nav>
      </header>
      <div className={styles.contentArea}>
        <PostTypeContent activePostType={activePostType} />
      </div>
    </div>
  );
}
