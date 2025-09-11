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
import { MatchDayIcon, UpNextIcon, SquadIcon, ResultIcon, BespokeIcon } from './CreatePageIcons';

import MatchDayAnnouncement from '@/components/MatchDayAnnouncement/MatchDayAnnouncement';
import SquadAnnouncement from '@/components/SquadAnnouncement/SquadAnnouncement';
import MatchResult from '@/components/MatchResult/MatchResult';

// TODO: Move placeholder components to their own files
const UpNextAnnouncement = () => {
    return (
        <div>
            <h2>Up Next Announcement</h2>
            <p>UI and functionality for creating the 'Up Next' match preview post will be built here.</p>
        </div>
    );
};

// TODO: Move placeholder components to their own files
const BespokePost = () => {
    return (
        <div>
            <h2>Bespoke Post</h2>
            <p>UI and functionality for creating a generic post with an image upload will be built here.</p>
            <p>This will include the image cropping and editing functionality we discussed.</p>
        </div>
    );
};

const postTypes = [
    { id: 'matchDay', label: 'Match Day', icon: <MatchDayIcon /> },
    { id: 'upNext', label: 'Up Next', icon: <UpNextIcon /> },
    { id: 'squad', label: 'Squad', icon: <SquadIcon /> },
    { id: 'result', label: 'Result', icon: <ResultIcon /> },
    { id: 'bespoke', label: 'Bespoke', icon: <BespokeIcon /> },
];

const PostTypeContent = ({ activePostType }) => {
    switch (activePostType) {
        case 'matchDay':
            return <MatchDayAnnouncement />;
        case 'upNext':
            return <UpNextAnnouncement />;
        case 'squad':
            return <SquadAnnouncement />;
        case 'result':
            return <MatchResult />;
        case 'bespoke':
            return <BespokePost />;
        default:
            return <MatchDayAnnouncement />;
    }
};

export default function CreatePage() {
    const [activePostType, setActivePostType] = useState('matchDay');

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
