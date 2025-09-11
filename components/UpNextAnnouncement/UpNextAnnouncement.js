/*
 * ==========================================================
 * COMPONENT: Up Next Announcement
 * PAGE: /
 * FILE: /components/UpNextAnnouncement/UpNextAnnouncement.js
 * ==========================================================
 */
'use client';
import { useState } from 'react';
import styles from './UpNextAnnouncement.module.css';
import { useAppContext } from '@/app/context/AppContext';

// MODIFIED: Imported the new reusable ImageEditor component
import ImageEditor from '@/components/ImageEditor/ImageEditor';

export default function UpNextAnnouncement() {
    const { appData, loading, error } = useAppContext();
    const { backgrounds, badges } = appData;

    // --- Component State ---
    const [homeTeamBadge, setHomeTeamBadge] = useState('');
    const [awayTeamBadge, setAwayTeamBadge] = useState('');
    const [matchDate, setMatchDate] = useState('');
    const [kickOffTime, setKickOffTime] = useState('');
    const [venue, setVenue] = useState('');
    const [teamType, setTeamType] = useState('First Team');
    const [caption, setCaption] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- Background State ---
    const [selectedBackground, setSelectedBackground] = useState('');
    const [saveCustomBackground, setSaveCustomBackground] = useState(true);

    // MODIFIED: This single function now handles the result from the ImageEditor component
    const handleCropComplete = (dataUrl) => {
        // The ImageEditor component provides the final, cropped image data.
        // We set it as the active background.
        setSelectedBackground(dataUrl);
    };

    const handleSelectGalleryBg = (bgLink) => {
        // When a gallery item is selected, it becomes the active background.
        // This will override any custom background.
        setSelectedBackground(bgLink);
    };

    // --- Form Submission Handlers ---
    const handleGeneratePreview = (e) => {
        e.preventDefault();
        alert("'Generate Preview' logic goes here.");
    };

    const handleYoloPost = (e) => {
        e.preventDefault();
        alert("'YOLO Post' logic goes here.");
    };

    if (loading) return <p className={styles.notice}>Loading assets...</p>;
    if (error) return <p className={`${styles.notice} ${styles.error}`}>{error}</p>;
    if (badges.length === 0) return <p className={styles.notice}>Please enter your Authorization Key on the Settings page to load assets.</p>;

    return (
        <form className={styles.pageContainer} onSubmit={handleGeneratePreview}>
            {/* Section 1: Configuration */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Up Next Announcement</h2>
                </div>
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
                     <div className={styles.formGroup}>
                        <label htmlFor="venue">Venue</label>
                        <input type="text" id="venue" placeholder="e.g., Cae Llan" value={venue} onChange={(e) => setVenue(e.target.value)} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="teamType">Team</label>
                        <select id="teamType" value={teamType} onChange={(e) => setTeamType(e.target.value)}>
                            <option value="First Team">First Team</option>
                            <option value="Development Team">Development Team</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Section 2: Background Selection */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Background</h3>
                </div>

                <h4 className={styles.subHeader}>Custom</h4>
                {/* MODIFIED: All complex cropper logic is replaced by our new component */}
                <ImageEditor onCropComplete={handleCropComplete} />
                
                <div className={styles.checkboxContainer}>
                    <input type="checkbox" id="saveCustomBg" checked={saveCustomBackground} onChange={(e) => setSaveCustomBackground(e.target.checked)} />
                    <label htmlFor="saveCustomBg">Save background for future use</label>
                </div>

                <h4 className={styles.subHeader}>Gallery</h4>
                <div className={styles.backgroundGrid}>
                    {backgrounds.map((bg) => (
                        <div
                            key={bg.Link}
                            className={`${styles.backgroundItem} ${selectedBackground === bg.Link ? styles.selected : ''}`}
                            onClick={() => handleSelectGalleryBg(bg.Link)}
                        >
                            <img src={bg.Link} alt={bg.Name} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 3: Caption */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Post Caption</h3>
                    <button type="button" className={styles.aiButton}>✨ Generate with AI</button>
                </div>
                <textarea
                    className={styles.captionTextarea}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your caption here, or generate one with AI..."
                    rows={5}
                />
            </div>

             {/* Section 4: Tagging */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Tagging</h3>
                     <button type="button" className={styles.tagButton}>👥 Tag People</button>
                </div>
                <p style={{color: 'var(--text-secondary)', textAlign: 'center'}}>Tag players and sponsors to notify them in your post. (Feature coming soon)</p>
            </div>

            {/* Section 5: Actions */}
            <div className={styles.actionsContainer}>
                <div>
                    <button type="button" onClick={handleYoloPost} disabled={isSubmitting} className={styles.yoloButton}>
                        YOLO Post
                    </button>
                    <p className={styles.yoloWarning}>Output may vary - experimental feature.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className={styles.actionButton}>
                    Generate Preview
                </button>
            </div>
        </form>
    );
}
