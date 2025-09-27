/*
 * ==========================================================
 * COMPONENT: SquadForm
 * PAGE: Create Post, Schedule Post (Modal)
 * FILE: /components/common/PostCreationForms/SquadForm/SquadForm.js
 * ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
import styles from './SquadForm.module.css';
import ImageEditor from '@/components/ImageEditor/ImageEditor';
import { UploadIcon, GalleryIcon, GenerateIcon } from '@/components/CreatePage/SquadAnnouncement/SquadAnnouncementIcons';
import PlayerMultiSelect from '@/components/MatchHubPage/AddMatchForm/PlayerMultiSelect';

export default function SquadForm({ appData = {}, initialData, onSubmit, onYoloSubmit, isSubmitting, authKey }) {
    const { players = [], backgrounds = [], badges = [], matches = [] } = appData;

    const [formData, setFormData] = useState({});
    const [badgeMessage, setBadgeMessage] = useState('');
    const [backgroundSource, setBackgroundSource] = useState('gallery');
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

    useEffect(() => {
        // CORRECTED: Spread initialData first, then overwrite the selectedPlayers
        // property. This ensures the form starts with a clean, empty squad
        // regardless of the data passed from the parent component.
        setFormData({
            ...initialData,
            selectedPlayers: [], 
            saveCustomBackground: true,
        });
    }, [initialData]);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };
    
    const handleSquadChange = (newSquad) => {
        setFormData(prev => ({ ...prev, selectedPlayers: newSquad }));
    };

    const handleSelectGalleryBg = (bgLink) => {
        setFormData(prev => ({ ...prev, selectedBackground: bgLink }));
    };

    const handleCropComplete = (dataUrl) => {
        setFormData(prev => ({ ...prev, selectedBackground: dataUrl }));
    };

    const handleMatchSelect = (matchId) => {
        setBadgeMessage('');
        if (!matchId) {
            setFormData(prev => ({
                ...prev,
                homeTeamBadge: '',
                awayTeamBadge: '',
                matchDate: '',
                kickOffTime: '',
                venue: '',
                teamType: 'First Team',
                selectedMatchData: null,
                selectedPlayers: [] // Also ensure deselection clears the squad
            }));
            return;
        }
        const selectedMatch = matches.find(m => m.matchId === matchId);
        if (!selectedMatch) return;

        const venue = selectedMatch.venue;
        const matchDate = selectedMatch.matchDate;
        const kickOffTime = selectedMatch.matchTime;
        const teamType = selectedMatch.team === 'first-team' ? 'First Team' : 'Development Team';

        const squad = selectedMatch.squad && selectedMatch.squad.length > 0
            ? selectedMatch.squad.split(',').map(name => name.trim())
            : [];

        const homeTeamName = selectedMatch.homeOrAway === 'Home' ? 'Y Glannau' : selectedMatch.opponent;
        const awayTeamName = selectedMatch.homeOrAway === 'Away' ? 'Y Glannau' : selectedMatch.opponent;
        
        const glannauBadge = badges.find(b => b.Name.toLowerCase().includes('glannau'))?.Link || '';
        let foundHomeBadge = '', foundAwayBadge = '';

        if (homeTeamName.toLowerCase().includes('glannau')) { foundHomeBadge = glannauBadge; }
        if (awayTeamName.toLowerCase().includes('glannau')) { foundAwayBadge = glannauBadge; }
        
        const oppositionName = selectedMatch.opponent;
        const normalizedOppositionName = oppositionName.toLowerCase().replace(/ fc| afc| town| city| dev| development| u19s| pheonix/g, '').trim();
        
        const oppositionBadge = badges.find(badge => {
            if (badge.Name.toLowerCase().includes('glannau')) return false;
            const normalizedBadgeName = badge.Name.toLowerCase().replace('.png', '').split('-').pop();
            return normalizedOppositionName.includes(normalizedBadgeName);
        })?.Link || '';

        if (oppositionBadge) {
            if (homeTeamName.toLowerCase().includes('glannau')) { foundAwayBadge = oppositionBadge; } else { foundHomeBadge = oppositionBadge; }
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
            selectedMatchData: selectedMatch,
            selectedPlayers: squad
        }));
    };

    const handleCaptionGeneration = async () => {
        setIsGeneratingCaption(true);

        const playersWithSponsors = formData.selectedPlayers
            .map(playerName => {
                if (!playerName) return null;
                const playerObject = players.find(p => p.fullName === playerName);
                return {
                    fullName: playerName,
                    sponsor: playerObject ? playerObject.Sponsor : 'N/A'
                };
            })
            .filter(Boolean);

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
            teamType: formData.teamType,
            competition: formData.selectedMatchData?.competition || '',
            referee: formData.selectedMatchData?.referee || '',
            playersInSquad: playersWithSponsors
        };

        const payload = { page: 'squad', gameInfo };

        try {
            const response = await fetch('/api/generate-caption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) { throw new Error('Failed to generate caption.'); }
            const result = await response.json();
            setFormData(prev => ({ ...prev, caption: result.caption || 'Sorry, could not generate a caption.' }));
        } catch (err) {
            setFormData(prev => ({ ...prev, caption: `Error: ${err.message}` }));
        } finally {
            setIsGeneratingCaption(false);
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleYoloSubmit = (e) => {
        e.preventDefault();
        onYoloSubmit(formData);
    };

    return (
        <form className={styles.formContainer} onSubmit={handleSubmit}>
            <div className={styles.section}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroupFull}>
                        <label htmlFor="matchSelector">Select a Match (Optional)</label>
                        <select id="matchSelector" onChange={(e) => handleMatchSelect(e.target.value)} defaultValue="">
                            <option value="">-- Select an upcoming match --</option>
                            {matches.map((match) => {
                                const title = match.homeOrAway === 'Home' 
                                    ? `Y Glannau vs ${match.opponent}` 
                                    : `${match.opponent} vs Y Glannau`;
                                return (<option key={match.matchId} value={match.matchId}>{title}</option>);
                            })}
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
                <h3 className={styles.sectionTitle}>Select Squad</h3>
                <PlayerMultiSelect 
                    selectedPlayers={formData.selectedPlayers || []} 
                    onChange={handleSquadChange} 
                />
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Background</h3>
                    <div className={styles.backgroundTabs}>
                        <button type="button" className={`${styles.tabButton} ${backgroundSource === 'gallery' ? styles.active : ''}`} onClick={() => setBackgroundSource('gallery')}>
                            <span className={styles.tabIcon}><GalleryIcon /></span><span className={styles.tabLabel}>Gallery</span>
                        </button>
                        <button type="button" className={`${styles.tabButton} ${backgroundSource === 'custom' ? styles.active : ''}`} onClick={() => setBackgroundSource('custom')}>
                            <span className={styles.tabIcon}><UploadIcon /></span><span className={styles.tabLabel}>Custom</span>
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
                            <input type="checkbox" id="saveCustomBackground" checked={formData.saveCustomBackground} onChange={handleChange} />
                            <label htmlFor="saveCustomBackground">Save background for future use</label>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Post Caption</h3></div>
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
                    <button type="button" onClick={handleYoloSubmit} disabled={isSubmitting} className={styles.yoloButton}>{isSubmitting ? 'Sending...' : 'Post Now (YOLO)'}</button>
                </div>
            </div>
        </form>
    );
}
