/*
 * ==========================================================
 * COMPONENT: Squad Announcement
 * PAGE: /
 * FILE: /components/CreatePage/SquadAnnouncement/SquadAnnouncement.js
 * ==========================================================
 */
'use client';
import { useState } from 'react';
import styles from './SquadAnnouncement.module.css';
import { useAppContext } from '@/app/context/AppContext';
import SquadForm from '../../common/PostCreationForms/SquadForm/SquadForm';
import { GenerateIcon, EditIcon } from './SquadAnnouncementIcons';

const initialFormData = {
    homeTeamBadge: '',
    awayTeamBadge: '',
    caption: '',
    selectedBackground: '',
    saveCustomBackground: true,
    selectedPlayers: Array(16).fill(''),
};

export default function SquadAnnouncement() {
    const { appData, authKey, loading, error } = useAppContext();
    const { players } = appData;
    const [formData, setFormData] = useState(initialFormData);

    const [view, setView] = useState('CONFIG');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [message, setMessage] = useState('');
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [generatedPreviews, setGeneratedPreviews] = useState([]);
    
    const handleGenerateCaption = async (gameInfo) => {
        setIsGeneratingCaption(true);
        setFormData(prev => ({ ...prev, caption: '' }));
        const payload = { page: 'squad', gameInfo };
        try {
            const response = await fetch('/api/generate-caption', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
            if (!response.ok) { throw new Error('Failed to generate caption.'); }
            const result = await response.json();
            setFormData(prev => ({ ...prev, caption: result.caption || 'Sorry, could not generate a caption.' }));
        } catch (err) {
            setFormData(prev => ({ ...prev, caption: `Error: ${err.message}` }));
        } finally {
            setIsGeneratingCaption(false);
        }
    };
    
    const triggerWorkflow = async (action, data) => {
        if (!authKey || !data.selectedBackground) {
            alert('Please ensure you have an Authorization Key and have selected a background.');
            return;
        }
        setIsSubmitting(true);
        setMessage('');

        const playersWithSponsors = data.selectedPlayers
            .map(playerName => {
                if (!playerName) return null;
                const playerObject = players.find(p => p.fullName === playerName);
                return {
                    fullName: playerName,
                    sponsor: playerObject ? playerObject.Sponsor : 'N/A'
                };
            })
            .filter(Boolean);

        const payload = {
            action,
            players: playersWithSponsors,
            home_team_badge: data.homeTeamBadge,
            away_team_badge: data.awayTeamBadge,
            background: data.selectedBackground,
            caption: data.caption,
            save_background: data.saveCustomBackground
        };

        try {
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
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
                setFormData(initialFormData);
            }
        } catch (err) {
            setMessage(`Error: ${err.message}`);
            console.error('Workflow Trigger Error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGeneratePreview = (data) => triggerWorkflow('squad_announcement', data);
    const handleYoloPost = (data) => triggerWorkflow('squad_announcement_yolo', data);
    const handleBackToEdit = () => { setView('CONFIG'); setPreviewUrl(''); setMessage(''); };
    const handleSelectPreview = (url) => { setPreviewUrl(url); setView('PREVIEW'); };

    const handlePostToSocial = async () => {
        setIsSubmitting(true);
        setMessage('');
        const payload = { action: 'post_image', imageUrl: previewUrl, caption: formData.caption };
        try {
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
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
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
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
                                <button onClick={() => handleGenerateCaption(formData)} className={styles.aiButton} disabled={isGeneratingCaption}>
                                    <GenerateIcon />
                                    {isGeneratingCaption ? 'Generating...' : 'Regenerate'}
                                </button>
                            </div>
                            <textarea id="previewCaption" className={styles.previewCaptionTextarea} value={formData.caption} onChange={(e) => setFormData(prev => ({...prev, caption: e.target.value}))} rows={8} />
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
        <div className={styles.pageContainer}>
            <SquadForm
                appData={appData}
                initialData={formData}
                onSubmit={handleGeneratePreview}
                onYoloSubmit={handleYoloPost}
                onGenerateCaption={handleGenerateCaption}
                isSubmitting={isSubmitting}
                isGeneratingCaption={isGeneratingCaption}
            />
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
        </div>
    );
}
