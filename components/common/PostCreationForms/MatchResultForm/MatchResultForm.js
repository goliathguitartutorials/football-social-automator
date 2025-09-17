/*
 * ==========================================================
 * COMPONENT: MatchResultForm
 * PAGE: Create Post, Schedule Post (Modal)
 * FILE: /components/common/PostCreationForms/MatchResultForm/MatchResultForm.js
 * ==========================================================
 */
'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './MatchResultForm.module.css';
import ImageEditor from '@/components/ImageEditor/ImageEditor';
import { UploadIcon, GalleryIcon, GenerateIcon, AddIcon, RemoveIcon } from '@/components/CreatePage/MatchResult/MatchResultIcons';

// Autocomplete sub-component for player names
const PlayerAutocomplete = ({ value, onSelect, players }) => {
    const [searchTerm, setSearchTerm] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const filteredPlayers = searchTerm
        ? players.filter(p => p.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
        : players;

    useEffect(() => { setSearchTerm(value); }, [value]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (playerName) => {
        setSearchTerm(playerName);
        onSelect(playerName);
        setIsOpen(false);
    };

    return (
        <div className={styles.autocompleteWrapper} ref={wrapperRef}>
            <input
                type="text"
                className={styles.autocompleteInput}
                placeholder="Player Name or 'OG'"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); onSelect(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
            />
            {isOpen && filteredPlayers.length > 0 && (
                <ul className={styles.autocompleteList}>
                    {filteredPlayers.map(player => (
                        <li key={player.row_number} onClick={() => handleSelect(player.fullName)}>
                            {player.fullName}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// Sub-component for a single scorer input row
const ScorerInput = ({ scorer, onUpdate, onRemove, players }) => {
    return (
        <div className={styles.scorerRow}>
            <div className={styles.scorerPlayer}>
                <PlayerAutocomplete
                    value={scorer.name}
                    onSelect={(name) => onUpdate(scorer.id, 'name', name)}
                    players={players}
                />
            </div>
            <div className={styles.scorerMinute}>
                <input
                    type="number"
                    placeholder="Min"
                    value={scorer.minute}
                    onChange={(e) => onUpdate(scorer.id, 'minute', e.target.value)}
                    className={styles.minuteInput}
                />
            </div>
            <div className={styles.scorerPenalty}>
                <input
                    type="checkbox"
                    id={`penalty-${scorer.id}`}
                    checked={scorer.isPenalty}
                    onChange={(e) => onUpdate(scorer.id, 'isPenalty', e.target.checked)}
                />
                <label htmlFor={`penalty-${scorer.id}`}>P</label>
            </div>
            <button type="button" onClick={() => onRemove(scorer.id)} className={styles.removeScorerBtn}>
                <RemoveIcon />
            </button>
        </div>
    );
};

export const formatScorersForWebhook = (scorers, isGlannauHome) => {
    const groupedScorers = {};

    scorers.forEach(scorer => {
        if (!scorer.name || !scorer.minute) return;
        const key = scorer.name.trim().toUpperCase() === 'OG' ? 'OG' : scorer.name.trim();
        if (!groupedScorers[key]) {
            groupedScorers[key] = [];
        }
        groupedScorers[key].push({
            minute: scorer.minute,
            isPenalty: scorer.isPenalty
        });
    });

    const glannauScorerLines = Object.entries(groupedScorers).map(([name, goals]) => {
        goals.sort((a, b) => parseInt(a.minute) - parseInt(b.minute));
        const goalStrings = goals.map(g => `${g.minute}'${g.isPenalty ? ' (P)' : ''}`).join(', ');
        if (name === 'OG') {
            return `OG ${goalStrings}`;
        }
        const nameParts = name.split(' ');
        const formattedName = nameParts.length > 1
            ? `${nameParts[0].charAt(0).toUpperCase()}. ${nameParts.slice(1).join(' ')}`
            : name;
        return `${formattedName} ${goalStrings}`;
    });

    const payload = {};
    const homeScorers = isGlannauHome ? glannauScorerLines : [];
    const awayScorers = isGlannauHome ? [] : glannauScorerLines;

    for (let i = 1; i <= 8; i++) {
        payload[`home_team_scorer_${i}`] = homeScorers[i - 1] || " ";
        payload[`away_team_scorer_${i}`] = awayScorers[i - 1] || " ";
    }

    return payload;
};

export default function MatchResultForm({ appData = {}, initialData, onSubmit, onYoloSubmit, onGenerateCaption, isSubmitting, isGeneratingCaption }) {
    const { backgrounds = [], badges = [], matches = [], players = [] } = appData;
    const [formData, setFormData] = useState(initialData || { scorers: [{ id: 1, name: '', minute: '', isPenalty: false }] });
    const [badgeMessage, setBadgeMessage] = useState('');
    const [backgroundSource, setBackgroundSource] = useState('gallery');

    useEffect(() => {
        setFormData(initialData || { scorers: [{ id: 1, name: '', minute: '', isPenalty: false }] });
    }, [initialData]);
    
    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
    };

    const handleAddScorer = () => {
        const newScorer = { id: Date.now(), name: '', minute: '', isPenalty: false };
        setFormData(prev => ({ ...prev, scorers: [...prev.scorers, newScorer] }));
    };

    const handleRemoveScorer = (id) => {
        setFormData(prev => ({ ...prev, scorers: prev.scorers.filter(s => s.id !== id) }));
    };

    const handleScorerUpdate = (id, field, value) => {
        const newScorers = formData.scorers.map(scorer => {
            if (scorer.id === id) { return { ...scorer, [field]: value }; }
            return scorer;
        });
        setFormData(prev => ({ ...prev, scorers: newScorers }));
    };

    const handleMatchSelect = (eventId) => {
        setBadgeMessage('');
        if (!eventId) {
            setFormData(prev => ({ ...prev, homeTeamBadge: '', awayTeamBadge: '', homeTeamScore: '', awayTeamScore: '', scorers: [{ id: 1, name: '', minute: '', isPenalty: false }] }));
            return;
        }
        const selectedMatch = matches.find(m => m.eventId === eventId);
        if (!selectedMatch) return;
        const [homeTeamName, awayTeamName] = selectedMatch.title.split(' vs ');
        const glannauBadge = badges.find(b => b.Name.toLowerCase().includes('glannau'))?.Link || '';
        let foundHomeBadge = '', foundAwayBadge = '';

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
        
        setFormData(prev => ({ ...prev, homeTeamBadge: foundHomeBadge, awayTeamBadge: foundAwayBadge }));
    };

    const handleSelectGalleryBg = (bgLink) => {
        setFormData(prev => ({ ...prev, selectedBackground: bgLink }));
    };

    const handleCropComplete = (dataUrl) => {
        setFormData(prev => ({ ...prev, selectedBackground: dataUrl }));
    };

    return (
        <form className={styles.formContainer} onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
            <div className={styles.section}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroupFull}>
                        <label htmlFor="matchSelector">Select a Match (Optional)</label>
                        <select id="matchSelector" onChange={(e) => handleMatchSelect(e.target.value)} defaultValue="">
                            <option value="">-- Select a recent match --</option>
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
                        <label htmlFor="homeTeamScore">Home Team Score</label>
                        <input type="number" id="homeTeamScore" placeholder="e.g., 3" value={formData.homeTeamScore || ''} onChange={handleChange} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="awayTeamScore">Away Team Score</label>
                        <input type="number" id="awayTeamScore" placeholder="e.g., 1" value={formData.awayTeamScore || ''} onChange={handleChange} required />
                    </div>
                </div>
            </div>
            
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Goal Scorers (Y Glannau only)</h3>
                </div>
                <div className={styles.scorersContainer}>
                    {formData.scorers.map((scorer) => (
                        <ScorerInput
                            key={scorer.id}
                            scorer={scorer}
                            onUpdate={handleScorerUpdate}
                            onRemove={handleRemoveScorer}
                            players={players || []}
                        />
                    ))}
                </div>
                <button type="button" onClick={handleAddScorer} className={styles.addScorerBtn}>
                    <AddIcon /> Add Scorer
                </button>
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
                    <button type="button" className={styles.aiButton} onClick={() => onGenerateCaption(formData)} disabled={isGeneratingCaption}>
                        <GenerateIcon />
                        {isGeneratingCaption ? 'Generating...' : 'Generate with AI'}
                    </button>
                </div>
            </div>

            <div className={styles.actionsContainer}>
                <button type="submit" disabled={isSubmitting} className={styles.actionButton}>{isSubmitting ? 'Generating...' : 'Generate Preview'}</button>
                <div className={styles.yoloAction}>
                    <button type="button" onClick={() => onYoloSubmit(formData)} disabled={isSubmitting} className={styles.yoloButton}>{isSubmitting ? 'Sending...' : 'Post Now (YOLO)'}</button>
                </div>
            </div>
        </form>
    );
}
