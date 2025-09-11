/*
 * ==========================================================
 * COMPONENT: Updates Page
 * PAGE: /updates
 * FILE: /app/(main)/updates/Updates.module.css
 ==========================================================
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './CreatePage.module.css';
import { UpNextIcon, MatchDayIcon, SquadIcon, ResultIcon, BespokeIcon } from './CreatePageIcons';

import MatchDayAnnouncement from '@/components/MatchDayAnnouncement/MatchDayAnnouncement';
import SquadAnnouncement from '@/components/SquadAnnouncement/SquadAnnouncement';
import MatchResult from '@/components/MatchResult/MatchResult';
import BespokePost from '@/components/BespokePost/BespokePost';

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
    { id: 'bespoke', label: 'Custom', icon: <BespokeIcon /> },
];

// MODIFIED: Map post types to their banner images and updated crop positions
const bannerImages = {
    upNext: { src: '/upnext.png', position: 'middleLow' }, // Adjusted lower
    matchDay: { src: '/matchday.png', position: 'top' }, // Perfect
    squad: { src: '/squad.png', position: 'middleHigh' }, // Adjusted higher
    result: { src: '/result.png', position: 'top' }, // Perfect
    bespoke: { src: '/custom.png', position: 'middleHigh' }, // Adjusted higher
};

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
    const activeBanner = bannerImages[activePostType];

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

                <div className={styles.bannerContainer}>
                    <Image
                        key={activePostType} // Helps React trigger transitions on change
                        src={activeBanner.src}
                        alt={`${postTypes.find((p) => p.id === activePostType)?.label} Banner`}
                        fill
                        priority
                        placeholder="blur" // MODIFIED: Added for perceived performance
                        blurDataURL={activeBanner.src} // Use the same image for the blur placeholder
                        className={`${styles.bannerImage} ${styles[activeBanner.position]}`}
                    />
                </div>
            </header>
            <div className={styles.contentArea}>
                <PostTypeContent activePostType={activePostType} />
            </div>
        </div>
    );
}
