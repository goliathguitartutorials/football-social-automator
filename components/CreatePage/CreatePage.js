/*
 * ==========================================================
 * COMPONENT: Create Page
 * PAGE: /
 * FILE: /components/CreatePage/CreatePage.js
 * ==========================================================
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './CreatePage.module.css';
import { UpNextIcon, MatchDayIcon, SquadIcon, ResultIcon, CustomImageIcon } from './CreatePageIcons';

import MatchDayAnnouncement from './MatchDayAnnouncement/MatchDayAnnouncement';
import SquadAnnouncement from './SquadAnnouncement/SquadAnnouncement';
import MatchResult from './MatchResult/MatchResult';
import CustomImagePost from './CustomImagePost/CustomImagePost'; // MODIFIED: Import new component
import UpNextAnnouncement from './UpNextAnnouncement/UpNextAnnouncement';

const postTypes = [
    { id: 'upNext', label: 'Up Next', icon: <UpNextIcon /> },
    { id: 'matchDay', label: 'Match Day', icon: <MatchDayIcon /> },
    { id: 'squad', label: 'Squad', icon: <SquadIcon /> },
    { id: 'result', label: 'Result', icon: <ResultIcon /> },
    // MODIFIED: Replaced 'bespoke' with 'customImage'
    { id: 'customImage', label: 'Custom Image', icon: <CustomImageIcon /> },
];

const bannerImages = {
    upNext: { src: '/upnext.png', position: 'middleMid' },
    matchDay: { src: '/matchday.png', position: 'top' },
    squad: { src: '/squad.png', position: 'top' },
    result: { src: '/result.png', position: 'top' },
    // MODIFIED: Replaced 'bespoke' with 'customImage'
    customImage: { src: '/custom.png', position: 'middleHighMore' },
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
        // MODIFIED: Replaced 'bespoke' case with 'customImage' case
        case 'customImage':
            return <CustomImagePost />;
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
                        key={activePostType}
                        src={activeBanner.src}
                        alt={`${postTypes.find((p) => p.id === activePostType)?.label} Banner`}
                        fill
                        priority
                        placeholder="blur"
                        blurDataURL={activeBanner.src}
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
