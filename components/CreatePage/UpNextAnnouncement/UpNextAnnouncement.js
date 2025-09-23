/*
 * ==========================================================
 * COMPONENT: Up Next Announcement
 * PAGE: /
 * FILE: /components/CreatePage/UpNextAnnouncement/UpNextAnnouncement.js
 * ==========================================================
 */
'use client';
import { useState } from 'react';
import styles from './UpNextAnnouncement.module.css';
import { useAppContext } from '@/app/context/AppContext';
import UpNextForm from '../../common/PostCreationForms/UpNextForm/UpNextForm';
import { GenerateIcon, EditIcon } from './UpNextAnnouncementIcons';

const initialFormData = {
    homeTeamBadge: '', awayTeamBadge: '', matchDate: '', kickOffTime: '', venue: '',
    teamType: 'First Team', caption: '', selectedBackground: '', saveCustomBackground: true,
    selectedMatchData: null,
};

const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return slots;
};
const timeSlots = generateTimeSlots();

export default function UpNextAnnouncement() {
    const { appData, authKey, loading, error } = useAppContext();
    const [formData, setFormData] = useState(initialFormData);
    const [view, setView] = useState('CONFIG');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [message, setMessage] = useState('');
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [generatedPreviews, setGeneratedPreviews] = useState([]);
    
    // New state for scheduling from preview
    const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduleTime, setScheduleTime] = useState('19:00');

    // The handleGenerateCaption function is now removed from this component.

    const triggerWorkflow = async (action, data) => {
        if (!authKey || !data.selectedBackground) {
            alert('Please ensure you have an Authorization Key and have selected a background.');
            return;
        }
        setIsSubmitting(true);
        setMessage('');

        const payload = {
            action, home_team_badge: data.homeTeamBadge, away_team_badge: data.awayTeamBadge,
            match_date: data.match_date, kick_off_time: data.kickOffTime, venue: data.venue,
            team: data.teamType, background: data.selectedBackground, caption: data.caption,
            save_background: data.saveCustomBackground
        };

        try {
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to trigger workflow.');
            if (action === 'upNext') {
                const imageUrl = result[0]?.data?.data?.content;
                if (!imageUrl) throw new Error("Image URL not found in API response.");
                setPreviewUrl(imageUrl);
                setGeneratedPreviews(prev => [...new Set([imageUrl, ...prev])]);
                setView('PREVIEW');
            } else if (action === 'yolo') {
                setMessage('YOLO post successfully generated and sent!');
                setFormData(initialFormData);
            }
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGeneratePreview = (data) => { setFormData(data); triggerWorkflow('upNext', data); };
    const handleYoloPost = (data) => triggerWorkflow('yolo', data);
    const handleBackToEdit = () => { setView('CONFIG'); setPreviewUrl(''); setMessage(''); };
    const handleSelectPreview = (url) => { setPreviewUrl(url); setView('PREVIEW'); };

    const handlePostToSocial = async () => {
        setIsSubmitting(true); setMessage('');
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
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsEditingImage(false);
        }
    };
    
    const handleSchedulePost = async () => {
        if (!scheduleDate || !scheduleTime) {
            alert('Please select a date and time to schedule the post.');
            return;
        }
        setIsSubmitting(true);
        setMessage('');

        const [hours, minutes] = scheduleTime.split(':');
        const finalScheduleDate = new Date(`${scheduleDate}T${hours}:${minutes}:00`);
        
        const payload = {
            action: 'schedule_post',
            schedule_time_utc: finalScheduleDate.toISOString(),
            post_type: 'upNext',
            image_gen_action: 'upNext',
            ...formData,
            background: previewUrl // Use the generated preview as the background
        };

        try {
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to schedule post.');
            setMessage('Post scheduled successfully!');
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
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
                                {/* This button is illustrative; caption regen in preview would need more context */}
                                <button className={styles.aiButton} disabled={true}>
                                    <GenerateIcon />
                                    Regenerate
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
                        <div className={styles.previewSection}>
                            <label>Schedule Post</label>
                            <div className={styles.scheduleInputs}>
                                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                                <select value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}>
                                    {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                            <button onClick={handleSchedulePost} className={styles.scheduleButton} disabled={isSubmitting || isEditingImage}>
                                {isSubmitting ? 'Scheduling...' : 'Schedule'}
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
            <UpNextForm
                appData={appData}
                initialData={formData}
                onSubmit={handleGeneratePreview}
                onYoloSubmit={handleYoloPost}
                isSubmitting={isSubmitting}
                authKey={authKey}
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
