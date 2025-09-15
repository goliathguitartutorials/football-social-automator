/*
 * ==========================================================
 * COMPONENT: UpNextForm
 * PAGE: Create Post, Schedule Post (Modal)
 * FILE: /components/common/PostCreationForms/UpNextForm/UpNextForm.js
 * ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
import styles from './UpNextForm.module.css';
import ImageEditor from '@/components/ImageEditor/ImageEditor';
import { UploadIcon, GalleryIcon, GenerateIcon } from '@/components/UpNextAnnouncement/UpNextAnnouncementIcons';

// Helper function to format the date as requested
const formatDateForWebhook = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00Z');
    const dayOfWeek = date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
    const dayOfMonth = date.getUTCDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
    const getOrdinalSuffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    };
    const suffix = getOrdinalSuffix(dayOfMonth);
    return `${dayOfWeek} ${dayOfMonth}${suffix} ${month}`;
};

export default function UpNextForm({ appData, initialData, onSubmit, onYoloSubmit, onGenerateCaption, isSubmitting, isGeneratingCaption }) {
    const { backgrounds, badges, matches } = appData;

    const [formData, setFormData] = useState(initialData || {});
    const [badgeMessage, setBadgeMessage] = useState('');
    const [backgroundSource, setBackgroundSource] = useState('gallery');

    useEffect(() => {
        setFormData(initialData || {});
    }, [initialData]);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectGalleryBg = (bgLink) => {
        setFormData(prev => ({ ...prev, selectedBackground: bgLink }));
    };

    const handleCropComplete = (dataUrl) => {
        setFormData(prev => ({ ...prev, selectedBackground: dataUrl }));
    };

    const handleMatchSelect = (eventId) => {
        setBadgeMessage('');
        if (!eventId) {
            setFormData(prev => ({
                ...prev,
                homeTeamBadge: '', awayTeamBadge: '', matchDate: '', kickOffTime: '', venue: '', teamType: 'First Team', selectedMatchData: null
            }));
            return;
        }

        const selectedMatch = matches.find(m => m.eventId === eventId);
        if (!selectedMatch) return;

        const venue = selectedMatch.venue;
        const dateTime = new Date(selectedMatch.startDateTime);
        const matchDate = dateTime.toISOString().split('T')[0];
        const kickOffTime = dateTime.toTimeString().substring(0, 5);
        const teamType = `${selectedMatch.team.charAt(0).toUpperCase()}${selectedMatch.team.slice(1)} Team`.replace('First-team', 'First Team');

        const [homeTeamName, awayTeamName] = selectedMatch.title.split(' vs ');
        const glannauBadge = badges.find(b => b.Name.toLowerCase().includes('glannau'))?.Link || '';
        let foundHomeBadge = '';
        let foundAwayBadge = '';

        if (homeTeamName.toLowerCase().includes('glannau')) { foundHomeBadge = glannauBadge; }
        if (awayTeamName.toLowerCase().includes('glannau')) { foundAwayBadge = glannauBadge; }

        const oppositionName = homeTeamName.toLowerCase().includes('glannau') ? awayTeamName : homeTeamName;
        const normalizedOppositionName = oppositionName.toLowerCase().replace(/ fc| afc| town| city| dev| development| u19s| pheonix/g, '').trim();
        const oppositionBadge = badges.find(badge => {
            if (badge.Name.toLowerCase().includes('glannau')) return false;
            const normalizedBadgeName = badge.Name.toLowerCase().replace('.png', '').split('-').pop();
            return normalizedOppositionName.includes(normalizedBadgeName);
        })?.Link || '';

        if (oppositionBadge) {
            if (homeTeamName.toLowerCase().includes('glannau')) { foundAwayBadge = oppositionBadge; } else { foundHomeBadge = oppositionBadge; }
        } else if (!homeTeamName.toLowerCase().includes('glannau') && !awayTeamName.toLowerCase().includes('glannau')) {
            setBadgeMessage("Could not automatically match badges. Please select manually.");
        } else {
            setBadgeMessage("Opposition badge not matched. Please select manually.");
        }

        setFormData(prev => ({
            ...prev,
            homeTeamBadge: foundHomeBadge,
            awayTeamBadge: foundAwayBadge,
            matchDate,
            kickOffTime,
            venue,
            teamType,
            selectedMatchData: selectedMatch
        }));
    };

    const handleCaptionGeneration = () => {
        const getTeamNameFromBadge = (badgeUrl) => {
            const badge = badges.find(b => b.Link === badgeUrl);
            if (!badge) return 'Unknown Team';
            return badge.Name.replace(/.png/i, '').substring(14);
        };
        const gameInfo = {
            homeTeam: getTeamNameFromBadge(formData.homeTeamBadge),
            awayTeam: getTeamNameFromBadge(formData.awayTeamBadge),
            matchDate: formData.matchDate,
            kickOffTime: formData.kickOffTime,
            venue: formData.venue,
            teamType: formData.teamType
        };
        if (formData.selectedMatchData) {
            gameInfo.competition = formData.selectedMatchData.competition || '';
            gameInfo.referee = formData.selectedMatchData.referee || '';
        }
        onGenerateCaption(gameInfo);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formattedDate = formatDateForWebhook(formData.matchDate);
        onSubmit({ ...formData, match_date: formattedDate });
    };
    
    const handleYolo = (e) => {
        e.preventDefault();
        const formattedDate = formatDateForWebhook(formData.matchDate);
        onYoloSubmit({ ...formData, match_date: formattedDate });
    };

    return (
        <form className={styles.formContainer} onSubmit={handleSubmit}>
            <div className={styles.section}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroupFull}>
                        <label htmlFor="matchSelector">Select a Match (Optional)</label>
                        <select id="matchSelector" onChange={(e) => handleMatchSelect(e.target.value)} defaultValue="">
                            <option value="">-- Select an upcoming match --</option>
                            {matches.map((match) => (<option key={match.eventId} value={match.eventId}>{match.title}</option>))}
                        </select>
                    </div>
                    {badgeMessage && <p className={styles.badgeNotice}>{badgeMessage}</p>}
                    <div className={styles.formGroup}>
                        <label htmlFor="homeTeamBadge">Home Team Badge</label>
                        <select id="homeTeamBadge" value={formData.homeTeamBadge || ''} onChange={handleChange} required>
                            <option value="">Select a badge...</option>
                            {badges.map((badge) => (<option key={badge.Link} value={badge.Link}>{badge.Name.replace(/.png/i, '').substring(14)}</option>))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="awayTeamBadge">Away Team Badge</label>
                        <select id="awayTeamBadge" value={formData.awayTeamBadge || ''} onChange={handleChange} required>
                            <option value="">Select a badge...</option>
                            {badges.map((badge) => (<option key={badge.Link} value={badge.Link}>{badge.Name.replace(/.png/i, '').substring(14)}</option>))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="matchDate">Match Date</label>
                        <input type="date" id="matchDate" value={formData.matchDate || ''} onChange={handleChange} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="kickOffTime">Kick-off Time</label>
                        <input type="time" id="kickOffTime" value={formData.kickOffTime || ''} onChange={handleChange} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="venue">Venue</label>
                        <input type="text" id="venue" placeholder="e.g., Cae Llan" value={formData.venue || ''} onChange={handleChange} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="teamType">Team</label>
                        <select id="teamType" value={formData.teamType || 'First Team'} onChange={handleChange}>
                            <option value="First Team">First Team</option>
                            <option value="Development Team">Development Team</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Background</h3>
                    <div className={styles.backgroundTabs}>
                        <button type="button" className={`${styles.tabButton} ${backgroundSource === 'gallery' ? styles.active : ''}`} onClick={() => setBackgroundSource('gallery')}>
                            <span className={styles.tabIcon}><GalleryIcon /></span>
                            <span className={styles.tabLabel}>Gallery</span>
                        </button>
                        <button type="button" className={`${styles.tabButton} ${backgroundSource === 'custom' ? styles.active : ''}`} onClick={() => setBackgroundSource('custom')}>
                            <span className={styles.tabIcon}><UploadIcon /></span>
                            <span className={styles.tabLabel}>Custom</span>
                        </button>
                    </div>
                </div>
                {backgroundSource === 'gallery' && (
                    <div className={styles.backgroundGrid}>
                        {backgrounds.map((bg) => (<div key={bg.Link} className={`${styles.backgroundItem} ${formData.selectedBackground === bg.Link ? styles.selected : ''}`} onClick={() => handleSelectGalleryBg(bg.Link)}><img src={bg.Link} alt={bg.Name} /></div>))}
                    </div>
                )}
                {backgroundSource === 'custom' && (
                    <div className={styles.customBackgroundContainer}>
                        <ImageEditor onCropComplete={handleCropComplete} />
                        <div className={styles.checkboxContainer}>
                            <input type="checkbox" id="saveCustomBackground" checked={formData.saveCustomBackground || true} onChange={handleChange} />
                            <label htmlFor="saveCustomBackground">Save background for future use</label>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Post Caption</h3>
                </div>
                <textarea id="caption" className={styles.captionTextarea} value={formData.caption || ''} onChange={handleChange} placeholder="Write your caption here, or generate one with AI..." rows={5} />
                <div className={styles.aiButtonContainer}>
                    <button type="button" className={styles.aiButton} onClick={handleCaptionGeneration} disabled={isGeneratingCaption}>
                        <GenerateIcon />
                        {isGeneratingCaption ? 'Generating...' : 'Generate with AI'}
                    </button>
                </div>
            </div>
            
            <div className={styles.actionsContainer}>
                <button type="submit" disabled={isSubmitting} className={styles.actionButton}>{isSubmitting ? 'Generating...' : 'Generate Preview'}</button>
                <div className={styles.yoloAction}>
                    <button type="button" onClick={handleYolo} disabled={isSubmitting} className={styles.yoloButton}>{isSubmitting ? 'Sending...' : 'Post Now (YOLO)'}</button>
                </div>
            </div>
        </form>
    );
}
