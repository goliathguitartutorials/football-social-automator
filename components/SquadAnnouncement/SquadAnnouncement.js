/*
 * ==========================================================
 * COMPONENT: Squad Announcement
 * PAGE: /
 * FILE: /components/SquadAnnouncement/SquadAnnouncement.js
 ==========================================================
 */
'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './SquadAnnouncement.module.css';
import { useAppContext } from '@/app/context/AppContext';
import ImageEditor from '@/components/ImageEditor/ImageEditor';
import { UploadIcon, GalleryIcon, GenerateIcon, EditIcon } from './SquadAnnouncementIcons';

// Sub-component for player selection with autocomplete
const PlayerAutocomplete = ({ index, value, onSelect, players, selectedPlayers }) => {
    const [searchTerm, setSearchTerm] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Filter out already selected players
    const availablePlayers = players.filter(p => !selectedPlayers.includes(p.fullName) || p.fullName === value);
    const filteredPlayers = searchTerm
        ? availablePlayers.filter(p => p.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
        : availablePlayers;

    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    // Close dropdown when clicking outside
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
        onSelect(index, playerName);
        setIsOpen(false);
    };
    
    return (
        <div className={styles.autocompleteWrapper} ref={wrapperRef}>
            <input
                type="text"
                className={styles.autocompleteInput}
                placeholder={`Player ${index + 1}`}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false); }}
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


export default function SquadAnnouncement() {
    const { appData, authKey, loading, error } = useAppContext();
    const { players, backgrounds, badges, matches } = appData;

    const [homeTeamBadge, setHomeTeamBadge] = useState('');
    const [awayTeamBadge, setAwayTeamBadge] = useState('');
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
    const [selectedPlayers, setSelectedPlayers] = useState(Array(16).fill(''));

    const handlePlayerSelect = (index, value) => {
        const newSelectedPlayers = [...selectedPlayers];
        newSelectedPlayers[index] = value;
        setSelectedPlayers(newSelectedPlayers);
    };
    
    const handleMatchSelect = (eventId) => {
        setBadgeMessage('');
        if (!eventId) {
            setHomeTeamBadge('');
            setAwayTeamBadge('');
            return;
        }
        const selectedMatch = matches.find(m => m.eventId === eventId);
        if (!selectedMatch) return;

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
        setHomeTeamBadge(foundHomeBadge);
        setAwayTeamBadge(foundAwayBadge);
    };

    const handleGenerateCaption = async () => {
        setIsGeneratingCaption(true);
        setCaption('');

        const getTeamNameFromBadge = (badgeUrl) => {
            const badge = badges.find(b => b.Link === badgeUrl);
            if (!badge) return 'Unknown Team';
            return badge.Name.replace(/.png/i, '').substring(14);
        };
        
        const gameInfo = {
            homeTeam: getTeamNameFromBadge(homeTeamBadge),
            awayTeam: getTeamNameFromBadge(awayTeamBadge),
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
            setCaption(result.caption || 'Sorry, could not generate a caption.');
        } catch (err) {
            setCaption(`Error: ${err.message}`);
        } finally {
            setIsGeneratingCaption(false);
        }
    };
    
    const triggerWorkflow = async (action) => {
        if (!authKey || !selectedBackground) {
            alert('Please ensure you have an Authorization Key and have selected a background.');
            return;
        }
        setIsSubmitting(true);
        setMessage('');

        const playersWithSponsors = selectedPlayers
            .map(playerName => {
                if (!playerName) return null;
                const playerObject = players.find(p => p.fullName === playerName);
                return {
                    fullName: playerName,
                    sponsor: playerObject ? playerObject.Sponsor : 'N/A'
                };
            })
            .filter(Boolean); // Remove null entries

        const payload = {
            action,
            players: playersWithSponsors,
            home_team_badge: homeTeamBadge,
            away_team_badge: awayTeamBadge,
            background: selectedBackground,
            caption,
            save_background: saveCustomBackground
        };

        try {
            const response = await fetch('/api/trigger-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to trigger workflow.');

            if (action === 'squad_announcement') {
                const imageUrl = result[0]?.data?.data?.content;
                if (!imageUrl) throw new Error("Image URL not found in API response.");
                setPreviewUrl(imageUrl);
                setGeneratedPreviews(prev => [...new Set([imageUrl, ...prev])]);
                setView('PREVIEW');
            } else if (action === 'squad_announcement_yolo') {
                setMessage('YOLO post successfully generated and sent!');
            }
        } catch (err) {
            setMessage(`Error: ${err.message}`);
            console.error('Workflow Trigger Error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGeneratePreview = () => triggerWorkflow('squad_announcement');
    const handleYoloPost = () => triggerWorkflow('squad_announcement_yolo');
    const handleBackToEdit = () => { setView('CONFIG'); setPreviewUrl(''); setMessage(''); };
    const handleCropComplete = (dataUrl) => { setSelectedBackground(dataUrl); };
    const handleSelectGalleryBg = (bgLink) => { setSelectedBackground(bgLink); };
    const handleSelectPreview = (url) => { setPreviewUrl(url); setView('PREVIEW'); };

    const handlePostToSocial = async () => {
        setIsSubmitting(true);
        setMessage('');
        const payload = { action: 'post_image', imageUrl: previewUrl, caption: caption };
        try {
            const response = await fetch('/api/trigger-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to post to social media.');
            setMessage('Successfully posted to social media!');
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditImage = async () => {
        if (!editPrompt) { alert('Please provide instructions for the image edit.'); return; }
        setIsEditingImage(true);
        setMessage('');
        const payload = { action: 'edit_image', imageUrl: previewUrl, prompt: editPrompt };
        try {
            const response = await fetch('/api/trigger-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to edit image.');
            const newImageUrl = result[0]?.data?.data?.content;
            if (!newImageUrl) throw new Error("Edited image URL not found in API response.");
            setPreviewUrl(newImageUrl);
            setGeneratedPreviews(prev => [...new Set([newImageUrl, ...prev])]);
            setMessage('Image successfully updated!');
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsEditingImage(false);
        }
    };

    if (loading) return <p className={styles.notice}>Loading assets...</p>;
    if (error) return <p className={`${styles.notice} ${styles.error}`}>{error}</p>;

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
                <div className={styles.formGroupFull}>
                    <label htmlFor="matchSelector">Select a Match (Optional)</label>
                    <select id="matchSelector" onChange={(e) => handleMatchSelect(e.target.value)} defaultValue="">
                        <option value="">-- Select an upcoming match --</option>
                        {matches.map((match) => (<option key={match.eventId} value={match.eventId}>{match.title}</option>))}
                    </select>
                </div>
            </div>

            <div className={styles.section}>
                 <div className={styles.formGrid}>
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
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Select Players (1-16)</h3>
                <div className={styles.playerGrid}>
                    {selectedPlayers.map((player, index) => (
                       <PlayerAutocomplete
                            key={index}
                            index={index}
                            value={player}
                            onSelect={handlePlayerSelect}
                            players={players}
                            selectedPlayers={selectedPlayers}
                        />
                    ))}
                </div>
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
