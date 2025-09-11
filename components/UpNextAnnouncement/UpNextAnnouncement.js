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
import ImageEditor from '@/components/ImageEditor/ImageEditor';

export default function UpNextAnnouncement() {
    const { appData, loading, error } = useAppContext();
    const { backgrounds, badges, matches } = appData;

    // --- Component State ---
    const [homeTeamBadge, setHomeTeamBadge] = useState('');
    const [awayTeamBadge, setAwayTeamBadge] = useState('');
    const [matchDate, setMatchDate] = useState('');
    const [kickOffTime, setKickOffTime] = useState('');
    const [venue, setVenue] = useState('');
    const [teamType, setTeamType] = useState('First Team');
    const [caption, setCaption] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // NEW: State for the badge matching notification message
    const [badgeMessage, setBadgeMessage] = useState('');
    
    // --- Background State ---
    const [selectedBackground, setSelectedBackground] = useState('');
    const [saveCustomBackground, setSaveCustomBackground] = useState(true);

    const handleMatchSelect = (eventId) => {
        setBadgeMessage(''); // Clear any previous message
        if (!eventId) {
            // If the user selects the default "-- Select --" option, clear the form
            setHomeTeamBadge('');
            setAwayTeamBadge('');
            setMatchDate('');
            setKickOffTime('');
            setVenue('');
            setTeamType('First Team');
            return;
        }

        const selectedMatch = matches.find(m => m.eventId === eventId);
        if (!selectedMatch) return;

        // --- Auto-populate standard fields ---
        setVenue(selectedMatch.venue);
        const dateTime = new Date(selectedMatch.startDateTime);
        setMatchDate(dateTime.toISOString().split('T')[0]);
        setKickOffTime(dateTime.toTimeString().substring(0, 5));
        const formattedTeamType = `${selectedMatch.team.charAt(0).toUpperCase()}${selectedMatch.team.slice(1)} Team`.replace('First-team', 'First Team');
        setTeamType(formattedTeamType);

        // --- Advanced Badge Matching Logic ---
        const [homeTeamName, awayTeamName] = selectedMatch.title.split(' vs ');

        // 1. Find the official "Y Glannau" badge first
        const glannauBadge = badges.find(b => b.Name.toLowerCase().includes('glannau'))?.Link || '';

        let foundHomeBadge = '';
        let foundAwayBadge = '';

        // 2. Assign Glannau badge based on home/away status
        if (homeTeamName.toLowerCase().includes('glannau')) {
            foundHomeBadge = glannauBadge;
        }
        if (awayTeamName.toLowerCase().includes('glannau')) {
            foundAwayBadge = glannauBadge;
        }

        // 3. Find the opposition badge
        const oppositionName = homeTeamName.toLowerCase().includes('glannau') ? awayTeamName : homeTeamName;
        const normalizedOppositionName = oppositionName.toLowerCase().replace(/ fc| afc| town| city| dev| development| u19s| pheonix/g, '').trim();
        
        const oppositionBadge = badges.find(badge => {
            if (badge.Name.toLowerCase().includes('glannau')) return false; // Don't match Glannau again
            const normalizedBadgeName = badge.Name.toLowerCase().replace('.png', '').split('-').pop();
            return normalizedOppositionName.includes(normalizedBadgeName);
        })?.Link || '';

        // 4. Assign the found opposition badge
        if (oppositionBadge) {
            if (homeTeamName.toLowerCase().includes('glannau')) {
                foundAwayBadge = oppositionBadge;
            } else {
                foundHomeBadge = oppositionBadge;
            }
        } else if (!homeTeamName.toLowerCase().includes('glannau') && !awayTeamName.toLowerCase().includes('glannau')) {
            // Handle case where neither team is Glannau (future proofing)
             setBadgeMessage("Could not automatically match badges. Please select manually.");
        } else {
             setBadgeMessage("Opposition badge not matched. Please select manually.");
        }

        setHomeTeamBadge(foundHomeBadge);
        setAwayTeamBadge(foundAwayBadge);
    };

    const handleCropComplete = (dataUrl) => { setSelectedBackground(dataUrl); };
    const handleSelectGalleryBg = (bgLink) => { setSelectedBackground(bgLink); };
    const handleGeneratePreview = (e) => { e.preventDefault(); alert("'Generate Preview' logic goes here."); };
    const handleYoloPost = (e) => { e.preventDefault(); alert("'YOLO Post' logic goes here."); };

    if (loading) return <p className={styles.notice}>Loading assets...</p>;
    if (error) return <p className={`${styles.notice} ${styles.error}`}>{error}</p>;
    if (badges.length === 0) return <p className={styles.notice}>Please enter your Authorization Key on the Settings page to load assets.</p>;

    return (
        <form className={styles.pageContainer} onSubmit={handleGeneratePreview}>
            <div className={styles.section}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroupFull}>
                         <label htmlFor="matchSelector">Select a Match (Optional)</label>
                         <select id="matchSelector" onChange={(e) => handleMatchSelect(e.target.value)} defaultValue="">
                            <option value="">-- Select an upcoming match --</option>
                            {matches.map((match) => ( <option key={match.eventId} value={match.eventId}>{match.title}</option> ))}
                        </select>
                    </div>
                    {/* NEW: Conditionally render the badge notice */}
                    {badgeMessage && <p className={styles.badgeNotice}>{badgeMessage}</p>}
                    <div className={styles.formGroup}>
                        <label htmlFor="homeTeamBadge">Home Team Badge</label>
                        <select id="homeTeamBadge" value={homeTeamBadge} onChange={(e) => setHomeTeamBadge(e.target.value)} required>
                            <option value="">Select a badge...</option>
                            {badges.map((badge) => ( <option key={badge.Link} value={badge.Link}>{badge.Name.replace(/.png/i, '').substring(14)}</option> ))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="awayTeamBadge">Away Team Badge</label>
                        <select id="awayTeamBadge" value={awayTeamBadge} onChange={(e) => setAwayTeamBadge(e.target.value)} required>
                            <option value="">Select a badge...</option>
                            {badges.map((badge) => ( <option key={badge.Link} value={badge.Link}>{badge.Name.replace(/.png/i, '').substring(14)}</option> ))}
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

            <div className={styles.section}>
                <div className={styles.sectionHeader}> <h3 className={styles.sectionTitle}>Background</h3> </div>
                <h4 className={styles.subHeader}>Custom</h4>
                <ImageEditor onCropComplete={handleCropComplete} />
                <div className={styles.checkboxContainer}>
                    <input type="checkbox" id="saveCustomBg" checked={saveCustomBackground} onChange={(e) => setSaveCustomBackground(e.target.checked)} />
                    <label htmlFor="saveCustomBg">Save background for future use</label>
                </div>
                <h4 className={styles.subHeader}>Gallery</h4>
                <div className={styles.backgroundGrid}>
                    {backgrounds.map((bg) => (
                        <div key={bg.Link} className={`${styles.backgroundItem} ${selectedBackground === bg.Link ? styles.selected : ''}`} onClick={() => handleSelectGalleryBg(bg.Link)}>
                            <img src={bg.Link} alt={bg.Name} />
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Post Caption</h3>
                    <button type="button" className={styles.aiButton}>✨ Generate with AI</button>
                </div>
                <textarea className={styles.captionTextarea} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write your caption here, or generate one with AI..." rows={5} />
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Tagging</h3>
                     <button type="button" className={styles.tagButton}>👥 Tag People</button>
                </div>
                <p style={{color: 'var(--text-secondary)', textAlign: 'center'}}>Tag players and sponsors to notify them in your post. (Feature coming soon)</p>
            </div>

            <div className={styles.actionsContainer}>
                <div>
                    <button type="button" onClick={handleYoloPost} disabled={isSubmitting} className={styles.yoloButton}> YOLO Post </button>
                    <p className={styles.yoloWarning}>Output may vary - experimental feature.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className={styles.actionButton}> Generate Preview </button>
            </div>
        </form>
    );
}
