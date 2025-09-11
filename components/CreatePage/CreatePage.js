/*
 * ==========================================================
 * COMPONENT: Updates Page
 * PAGE: /updates
 * FILE: /app/(main)/updates/Updates.module.css
 ==========================================================
 */
'use client';

import { useState } from 'react';
import styles from './CreatePage.module.css';
import { UpNextIcon, MatchDayIcon, SquadIcon, ResultIcon, BespokeIcon } from './CreatePageIcons';

import MatchDayAnnouncement from '@/components/MatchDayAnnouncement/MatchDayAnnouncement';
import SquadAnnouncement from '@/components/SquadAnnouncement/SquadAnnouncement';
import MatchResult from '@/components/MatchResult/MatchResult';
import BespokePost from '@/components/BespokePost/BespokePost'; // Corrected import path

// TODO: Move placeholder components to their own files
const UpNextAnnouncement = () => {
    return (
        <div>
            <h2>Up Next Announcement</h2>
            <p>UI and functionality for creating the 'Up Next' match preview post will be built here.</p>
        </div>
    );
};

const postTypes = [
    { id: 'upNext', label: 'Up Next', icon: <UpNextIcon /> },
    { id: 'matchDay', label: 'Match Day', icon: <MatchDayIcon /> },
    { id: 'squad', label: 'Squad', icon: <SquadIcon /> },
    { id: 'result', label: 'Result', icon: <ResultIcon /> },
    { id: 'bespoke', label: 'Bespoke', icon: <BespokeIcon /> },
];

const PostTypeContent = ({ activePostType }) => {
    switch (activePostType) {
        case 'upNext':
            return <UpNextAnnouncement />;
        case 'matchDay':
            return <MatchDayAnnouncement />;
        case 'squad':
            return <SquadAnnouncement />;
        case 'result':
            return <MatchResult />;
        case 'bespoke':
            return <BespokePost />;
        default:
            return <UpNextAnnouncement />;
    }
};

export default function CreatePage() {
    const [activePostType, setActivePostType] = useState('upNext');

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <nav className={styles.subNav}>
                    {postTypes.map((type) => (
                        <button
                            key={type.id}
                            className={`${styles.navButton} ${
                                activePostType === type.id ? styles.active : ''
                            }`}
                            onClick={() => setActivePostType(type.id)}
                        >
                            <span className={styles.navIcon}>{type.icon}</span>
                            <span className={styles.navLabel}>{type.label}</span>
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
