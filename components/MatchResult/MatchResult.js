/*
 * ==========================================================
 * COMPONENT: Match Result
 * PAGE: /
 * FILE: /components/MatchResult/MatchResult.js
 * ==========================================================
 */
'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './MatchResult.module.css';
import { useAppContext } from '@/app/context/AppContext';
import ImageEditor from '@/components/ImageEditor/ImageEditor';
import { UploadIcon, GalleryIcon, GenerateIcon, EditIcon, AddIcon, RemoveIcon } from './MatchResultIcons';

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


// MODIFIED: Helper function now accepts a key prefix
const formatScorersForWebhook = (scorers, keyPrefix) => {
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

    const formattedLines = Object.entries(groupedScorers).map(([name, goals]) => {
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
    for (let i = 1; i <= 8; i++) {
        // Use the dynamic key prefix
        payload[`${keyPrefix}_${i}`] = formattedLines[i - 1] || "";
    }
    return payload;
};

export default function MatchResult() {
    const { appData, authKey, loading, error } = useAppContext();
    const { backgrounds, badges, matches, players } = appData;

    const [homeTeamBadge, setHomeTeamBadge] = useState('');
    const [awayTeamBadge, setAwayTeamBadge] = useState('');
    const [homeTeamScore, setHomeTeamScore] = useState('');
    const [awayTeamScore, setAwayTeamScore] = useState('');
    const [scorers, setScorers] = useState([{ id: 1, name: '', minute: '', isPenalty: false }]);
    const [caption, setCaption] = useState('');
    const [selectedBackground, setSelectedBackground] = useState('');
    const [saveCustomBackground, setSaveCustomBackground] = useState(true);
    const [view, setView] = useState('CONFIG');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [message, setMessage] = useState('');
    const [badgeMessage, setBadgeMessage] = useState('');
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [backgroundSource, setBackgroundSource] = useState('gallery');
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [generatedPreviews, setGeneratedPreviews] = useState([]);

    const handleAddScorer = () => {
        const newScorer = { id: Date.now(), name: '', minute: '', isPenalty: false };
        setScorers([...scorers, newScorer]);
    };

    const handleRemoveScorer = (id) => {
        setScorers(scorers.filter(s => s.id !== id));
    };

    const handleScorerUpdate = (id, field, value) => {
        const newScorers = scorers.map(scorer => {
            if (scorer.id === id) { return { ...scorer, [field]: value }; }
            return scorer;
        });
        setScorers(newScorers);
    };

    const handleMatchSelect = (eventId) => {
        setBadgeMessage('');
        if (!eventId) {
            setHomeTeamBadge(''); setAwayTeamBadge(''); setHomeTeamScore(''); setAwayTeamScore('');
            setScorers([{ id: 1, name: '', minute: '', isPenalty: false }]);
            return;
        }
        const selectedMatch = matches.find(m => m.eventId === eventId);
        if (!selectedMatch) return;
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
        setIsGeneratingCaption(true); setCaption('');
        const getTeamNameFromBadge = (badgeUrl) => {
            const badge = badges.find(b => b.Link === badgeUrl);
            if (!badge) return 'Unknown Team';
            return badge.Name.replace(/.png/i, '').substring(14);
        };

        // NEW: Determine scorer key prefix
        const homeBadgeObject = badges.find(b => b.Link === homeTeamBadge);
        const isGlannauHome = homeBadgeObject && homeBadgeObject.Name.toLowerCase().includes('glannau');
        const scorerKeyPrefix = isGlannauHome ? 'home_team_scorer' : 'away_team_scorer';

        const gameInfo = {
            homeTeam: getTeamNameFromBadge(homeTeamBadge), awayTeam: getTeamNameFromBadge(awayTeamBadge),
            homeTeamScore, awayTeamScore,
            scorers: formatScorersForWebhook(scorers, scorerKeyPrefix)
        };
        const payload = { page: 'matchResult', gameInfo };
        try {
            const response = await fetch('/api/generate-caption', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
            if (!response.ok) { throw new Error('Failed to generate caption.'); }
            const result = await response.json();
            setCaption(result.caption || 'Sorry, could not generate a caption.');
        } catch (err) { setCaption(`Error: ${err.message}`);
        } finally { setIsGeneratingCaption(false); }
    };

    const triggerWorkflow = async (action) => {
        if (!authKey || !selectedBackground) { alert('Please ensure you have an Authorization Key and have selected a background.'); return; }
        setIsSubmitting(true); setMessage('');

        // NEW: Determine if Glannau is the home team based on the selected badge
        const homeBadgeObject = badges.find(b => b.Link === homeTeamBadge);
        const isGlannauHome = homeBadgeObject && homeBadgeObject.Name.toLowerCase().includes('glannau');
        const scorerKeyPrefix = isGlannauHome ? 'home_team_scorer' : 'away_team_scorer';

        // MODIFIED: Use the new formatting function with the correct prefix
        const formattedScorers = formatScorersForWebhook(scorers, scorerKeyPrefix);

        const payload = {
            action,
            home_team_badge: homeTeamBadge, away_team_badge: awayTeamBadge,
            home_team_score: homeTeamScore, away_team_score: awayTeamScore,
            ...formattedScorers,
            background: selectedBackground, caption, save_background: saveCustomBackground
        };

        try {
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to trigger workflow.');
            if (action === 'result') {
                const imageUrl = result[0]?.data?.data?.content;
                if (!imageUrl) throw new Error("Image URL not found in API response.");
                setPreviewUrl(imageUrl);
                setGeneratedPreviews(prev => [...new Set([imageUrl, ...prev])]);
                setView('PREVIEW');
            } else if (action === 'yoloResult') { setMessage('YOLO post successfully generated and sent!'); }
        } catch (err) { setMessage(`Error: ${err.message}`); console.error('Workflow Trigger Error:', err);
        } finally { setIsSubmitting(false); }
    };

    const handleGeneratePreview = () => triggerWorkflow('result');
    const handleYoloPost = () => triggerWorkflow('yoloResult');
    const handleBackToEdit = () => { setView('CONFIG'); setPreviewUrl(''); setMessage(''); };
    const handleCropComplete = (dataUrl) => { setSelectedBackground(dataUrl); };
    const handleSelectGalleryBg = (bgLink) => { setSelectedBackground(bgLink); };
    const handleSelectPreview = (url) => { setPreviewUrl(url); setView('PREVIEW'); };

    const handlePostToSocial = async () => {
        setIsSubmitting(true); setMessage('');
        const payload = { action: 'post_image', imageUrl: previewUrl, caption: caption };
        try {
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to post to social media.');
            setMessage('Successfully posted to social media!');
        } catch (err) { setMessage(`Error: ${err.message}`); console.error('Post to Social Error:', err);
        } finally { setIsSubmitting(false); }
    };
    
    const handleEditImage = async () => {
        if (!editPrompt) { alert('Please provide instructions for the image edit.'); return; }
        setIsEditingImage(true); setMessage('');
        const payload = { action: 'edit_image', imageUrl: previewUrl, prompt: editPrompt };
        try {
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to edit image.');
            const newImageUrl = result[0]?.data?.data?.content;
            if (!newImageUrl) throw new Error("Edited image URL not found in API response.");
            setPreviewUrl(newImageUrl);
            setGeneratedPreviews(prev => [...new Set([newImageUrl, ...prev])]);
            setMessage('Image successfully updated!');
        } catch (err) { setMessage(`Error: ${err.message}`); console.error('Image Edit Error:', err);
        } finally { setIsEditingImage(false); }
    };

    if (loading) return <p className={styles.notice}>Loading assets...</p>;
    if (error) return <p className={`${styles.notice} ${styles.error}`}>{error}</p>;

    // --- JSX for PREVIEW and CONFIG views remains unchanged below this line ---

    if (view === 'PREVIEW') {
        return (
             <div className={styles.previewContainer}>
                <h2>Preview & Refine</h2>
                <div className={styles.previewLayout}>
                    <div className={styles.previewImageWrapper}>
                        {isEditingImage ? <div className={styles.imageOverlay}>Editing Image...</div> : null}
                        {previewUrl ? <img src={previewUrl} alt="Generated post preview" className={styles.previewImage} /> : <p>Loading preview...</p>}
                    </div>
                    <div className={styles.previewControls}>
                        <div className={styles.previewSection}>
                            <div className={styles.previewSectionHeader}>
                                <label htmlFor="previewCaption">Post Caption</label>
                                <button onClick={handleGenerateCaption} className={styles.aiButton} disabled={isGeneratingCaption}>
                                    <GenerateIcon />
                                    {isGeneratingCaption ? 'Generating...' : 'Generate with AI'}
                                </button>
                            </div>
                            <textarea id="previewCaption" className={styles.previewCaptionTextarea} value={caption} onChange={(e) => setCaption(e.target.value)} rows={8} />
                        </div>
                        <div className={styles.previewSection}>
                            <label htmlFor="editPrompt">Request Image Edit</label>
                            <textarea id="editPrompt" className={styles.editPromptTextarea} value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="e.g., make the background darker..." rows={3} />
                            <button onClick={handleEditImage} className={styles.editImageButton} disabled={isEditingImage || isSubmitting}>
                                <EditIcon />
                                {isEditingImage ? 'Updating...' : 'Edit with AI'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className={styles.previewActions}>
                    <button onClick={handleBackToEdit} className={styles.backButton} disabled={isSubmitting || isEditingImage}>Back to Config</button>
                    <button onClick={handlePostToSocial} disabled={isSubmitting || isEditingImage} className={styles.postButton}>
                        {isSubmitting ? 'Posting...' : 'Post Now'}
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
                            <option value="">-- Select a recent match --</option>
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
                        <label htmlFor="homeTeamScore">Home Team Score</label>
                        <input type="number" id="homeTeamScore" placeholder="e.g., 3" value={homeTeamScore} onChange={(e) => setHomeTeamScore(e.target.value)} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="awayTeamScore">Away Team Score</label>
                        <input type="number" id="awayTeamScore" placeholder="e.g., 1" value={awayTeamScore} onChange={(e) => setAwayTeamScore(e.target.value)} required />
                    </div>
                </div>
            </div>
            
            <div className={styles.section}>
                 <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Goal Scorers (Y Glannau only)</h3>
                </div>
                <div className={styles.scorersContainer}>
                    {scorers.map((scorer) => (
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
                <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Post Caption</h3></div>
                <textarea className={styles.captionTextarea} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write your caption here, or generate one with AI..." rows={5} />
                <div className={styles.aiButtonContainer}>
                    <button type="button" className={styles.aiButton} onClick={handleGenerateCaption} disabled={isGeneratingCaption}>
                        <GenerateIcon />
                        {isGeneratingCaption ? 'Generating...' : 'Generate with AI'}
                    </button>
                </div>
            </div>

            <div className={styles.actionsContainer}>
                <button type="submit" disabled={isSubmitting} className={styles.actionButton}>{isSubmitting ? 'Generating...' : 'Generate Preview'}</button>
                <div className={styles.yoloAction}>
                    <button type="button" onClick={handleYoloPost} disabled={isSubmitting} className={styles.yoloButton}>{isSubmitting ? 'Sending...' : 'Post Now (YOLO)'}</button>
                </div>
            </div>
            
            {generatedPreviews.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Generated Previews</h3></div>
                    <div className={styles.previewsGrid}>
                        {generatedPreviews.map((url, index) => (
                            <div key={index} className={styles.previewItem} onClick={() => handleSelectPreview(url)}>
                                <img src={url} alt={`Generated Preview ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {message && <p className={styles.message}>{message}</p>}
        </form>
    );
}
