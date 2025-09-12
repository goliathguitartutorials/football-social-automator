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
import { UploadIcon, GalleryIcon } from './UpNextAnnouncementIcons';

export default function UpNextAnnouncement() {
    const { appData, authKey, loading, error } = useAppContext();
    const { backgrounds, badges, matches } = appData;

    const [homeTeamBadge, setHomeTeamBadge] = useState('');
    const [awayTeamBadge, setAwayTeamBadge] = useState('');
    const [matchDate, setMatchDate] = useState('');
    const [kickOffTime, setKickOffTime] = useState('');
    const [venue, setVenue] = useState('');
    const [teamType, setTeamType] = useState('First Team');
    const [caption, setCaption] = useState('');
    const [selectedBackground, setSelectedBackground] = useState('');
    const [saveCustomBackground, setSaveCustomBackground] = useState(true);
    const [view, setView] = useState('CONFIG');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [message, setMessage] = useState('');
    const [badgeMessage, setBadgeMessage] = useState('');
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [selectedMatchData, setSelectedMatchData] = useState(null);
    const [backgroundSource, setBackgroundSource] = useState('gallery');

    const handleMatchSelect = (eventId) => {
        setBadgeMessage('');
        if (!eventId) {
            setHomeTeamBadge(''); setAwayTeamBadge(''); setMatchDate(''); setKickOffTime(''); setVenue(''); setTeamType('First Team');
            setSelectedMatchData(null);
            return;
        }
        const selectedMatch = matches.find(m => m.eventId === eventId);
        if (!selectedMatch) return;
        setSelectedMatchData(selectedMatch);
        setVenue(selectedMatch.venue);
        const dateTime = new Date(selectedMatch.startDateTime);
        setMatchDate(dateTime.toISOString().split('T')[0]);
        setKickOffTime(dateTime.toTimeString().substring(0, 5));
        const formattedTeamType = `${selectedMatch.team.charAt(0).toUpperCase()}${selectedMatch.team.slice(1)} Team`.replace('First-team', 'First Team');
        setTeamType(formattedTeamType);
        const [homeTeamName, awayTeamName] = selectedMatch.title.split(' vs ');
        const glannauBadge = badges.find(b => b.Name.toLowerCase().includes('glannau'))?.Link || '';
        let foundHomeBadge = ''; let foundAwayBadge = '';
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
        } else { setBadgeMessage("Opposition badge not matched. Please select manually."); }
        setHomeTeamBadge(foundHomeBadge); setAwayTeamBadge(foundAwayBadge);
    };

    const handleGenerateCaption = async () => {
        setIsGeneratingCaption(true);
        setCaption('');
        const getTeamNameFromBadge = (badgeUrl) => {
            const badge = badges.find(b => b.Link === badgeUrl);
            if (!badge) return 'Unknown Team';
            return badge.Name.replace(/.png/i, '').substring(14);
        };
        const gameInfo = { homeTeam: getTeamNameFromBadge(homeTeamBadge), awayTeam: getTeamNameFromBadge(awayTeamBadge), matchDate, kickOffTime, venue, teamType };
        if (selectedMatchData) {
            gameInfo.competition = selectedMatchData.competition || '';
            gameInfo.referee = selectedMatchData.referee || '';
        }
        const payload = { page: 'upNext', gameInfo };
        try {
            const response = await fetch('/api/generate-caption', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
            if (!response.ok) { throw new Error('Failed to generate caption.'); }
            const result = await response.json();
            setCaption(result.caption || 'Sorry, could not generate a caption.');
        } catch (err) {
            setCaption(`Error: ${err.message}`);
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const triggerWorkflow = async (action) => {
        if (!authKey || !selectedBackground) { alert('Please ensure you have an Authorization Key and have selected a background.'); return; }
        setIsSubmitting(true);
        setMessage('');
        const payload = { action, home_team_badge: homeTeamBadge, away_team_badge: awayTeamBadge, match_date: matchDate, kick_off_time: kickOffTime, venue, team: teamType, background: selectedBackground, caption, save_background: saveCustomBackground };
        try {
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to trigger workflow.');
            if (action === 'upNext') {
                const imageUrl = result[0]?.data?.data?.content;
                if (!imageUrl) throw new Error("Image URL not found in API response.");
                setPreviewUrl(imageUrl);
                setView('PREVIEW');
            } else if (action === 'yolo') {
                setMessage('YOLO post successfully generated and sent!');
            }
        } catch (err) {
            setMessage(`Error: ${err.message}`);
            console.error('Workflow Trigger Error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGeneratePreview = () => triggerWorkflow('upNext');
    const handleYoloPost = () => triggerWorkflow('yolo');
    const handleBackToEdit = () => { setView('CONFIG'); setPreviewUrl(''); setMessage(''); };
    const handleCropComplete = (dataUrl) => { setSelectedBackground(dataUrl); };
    const handleSelectGalleryBg = (bgLink) => { setSelectedBackground(bgLink); };

    const handlePostToSocial = async () => {
        setIsSubmitting(true);
        setMessage('');
        const payload = { action: 'post_image', imageUrl: previewUrl, caption: caption };
        try {
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to post to social media.');
            setMessage('Successfully posted to social media!');
        } catch (err) {
            setMessage(`Error: ${err.message}`);
            console.error('Post to Social Error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <p className={styles.notice}>Loading assets...</p>;
    if (error) return <p className={`${styles.notice} ${styles.error}`}>{error}</p>;

    if (view === 'PREVIEW') {
        return (
            <div className={styles.previewContainer}>
                <h2>Preview</h2>
                {previewUrl ? <img src={previewUrl} alt="Generated post preview" className={styles.previewImage} /> : <p>Loading preview...</p>}
                <div className={styles.previewActions}>
                    <button onClick={handleBackToEdit} className={styles.backButton} disabled={isSubmitting}>Back to Edit</button>
                    <button onClick={handlePostToSocial} disabled={isSubmitting} className={styles.postButton}>
                        {isSubmitting ? 'Posting...' : 'Post to Social Media'}
                    </button>
                </div>
                {message && <p className={styles.message}>{message}</p>}
            </div>
        );
    }

    return (
        <form className={styles.pageContainer} onSubmit={(e) => { e.preventDefault(); handleGeneratePreview(); }}>
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
                        <select id="homeTeamBadge" value={homeTeamBadge} onChange={(e) => setHomeTeamBadge(e.target.value)} required>
                            <option value="">Select a badge...</option>
                            {badges.map((badge) => (<option key={badge.Link} value={badge.Link}>{badge.Name.replace(/.png/i, '').substring(14)}</option>))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="awayTeamBadge">Away Team Badge</label>
                        <select id="awayTeamBadge" value={awayTeamBadge} onChange={(e) => setAwayTeamBadge(e.target.value)} required>
                            <option value="">Select a badge...</option>
                            {badges.map((badge) => (<option key={badge.Link} value={badge.Link}>{badge.Name.replace(/.png/i, '').substring(14)}</option>))}
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
                        {backgrounds.map((bg) => (<div key={bg.Link} className={`${styles.backgroundItem} ${selectedBackground === bg.Link ? styles.selected : ''}`} onClick={() => handleSelectGalleryBg(bg.Link)}><img src={bg.Link} alt={bg.Name} /></div>))}
                    </div>
                )}

                {backgroundSource === 'custom' && (
                    <div className={styles.customBackgroundContainer}>
                        <ImageEditor onCropComplete={handleCropComplete} />
                        <div className={styles.checkboxContainer}>
                            <input type="checkbox" id="saveCustomBg" checked={saveCustomBackground} onChange={(e) => setSaveCustomBackground(e.target.checked)} />
                            <label htmlFor="saveCustomBg">Save background for future use</label>
                        </div>
                    </div>
                )}
            </div>
            
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Post Caption</h3>
                </div>
                <textarea className={styles.captionTextarea} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write your caption here, or generate one with AI..." rows={5} />
                <div className={styles.aiButtonContainer}>
                    <button type="button" className={styles.aiButton} onClick={handleGenerateCaption} disabled={isGeneratingCaption}>
                        {isGeneratingCaption ? 'Generating...' : '✨ Generate with AI'}
                    </button>
                </div>
            </div>

            <div className={styles.actionsContainer}>
                <div>
                    <button type="button" onClick={handleYoloPost} disabled={isSubmitting} className={styles.yoloButton}>{isSubmitting ? 'Sending...' : 'YOLO Post'}</button>
                    <p className={styles.yoloWarning}>Output may vary - experimental feature.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className={styles.actionButton}>{isSubmitting ? 'Generating...' : 'Generate Preview'}</button>
            </div>
            {message && <p className={styles.message}>{message}</p>}
        </form>
    );
}
