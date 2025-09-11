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
    const { appData, authKey, loading, error } = useAppContext();
    const { backgrounds, badges, matches } = appData;

    // --- Component State ---
    const [homeTeamBadge, setHomeTeamBadge] = useState('');
    const [awayTeamBadge, setAwayTeamBadge] = useState('');
    const [matchDate, setMatchDate] = useState('');
    const [kickOffTime, setKickOffTime] = useState('');
    const [venue, setVenue] = useState('');
    const [teamType, setTeamType] = useState('First Team');
    const [caption, setCaption] = useState('');
    const [selectedBackground, setSelectedBackground] = useState('');
    const [saveCustomBackground, setSaveCustomBackground] = useState(true);

    // --- Control State ---
    const [view, setView] = useState('CONFIG'); // 'CONFIG' or 'PREVIEW'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [message, setMessage] = useState('');
    const [badgeMessage, setBadgeMessage] = useState('');
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [selectedMatchData, setSelectedMatchData] = useState(null);


    const handleMatchSelect = (eventId) => {
        // ... (this function remains unchanged)
    };
    
    // --- Main Action Handlers ---
    const handleGeneratePreview = async () => {
        await triggerWorkflow('upNext');
    };

    const handleYoloPost = async () => {
        await triggerWorkflow('yolo');
    };

    const triggerWorkflow = async (action) => {
        if (!authKey || !selectedBackground) {
            alert('Please ensure you have an Authorization Key and have selected a background.');
            return;
        }
        
        setIsSubmitting(true);
        setMessage('');

        const payload = {
            action,
            home_team_badge: homeTeamBadge,
            away_team_badge: awayTeamBadge,
            match_date: matchDate,
            kick_off_time: kickOffTime,
            venue: venue,
            team: teamType,
            background: selectedBackground,
            caption: caption,
            save_background: saveCustomBackground,
        };

        try {
            const response = await fetch('/api/trigger-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify(payload),
            });

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

    const handleBackToEdit = () => {
        setView('CONFIG');
        setPreviewUrl('');
        setMessage('');
    };

    // Placeholder for posting from the preview screen
    const handlePostToSocial = async () => {
        alert("Posting to social media...");
        // This would be another API call with action: 'post_image'
    };

    // --- Other handlers remain the same ---
    const handleGenerateCaption = async () => { /* ... */ };
    const handleCropComplete = (dataUrl) => { setSelectedBackground(dataUrl); };
    const handleSelectGalleryBg = (bgLink) => { setSelectedBackground(bgLink); };

    if (loading) return <p className={styles.notice}>Loading assets...</p>;
    if (error) return <p className={`${styles.notice} ${styles.error}`}>{error}</p>;

    if (view === 'PREVIEW') {
        return (
            <div className={styles.previewContainer}>
                <h2>Preview</h2>
                {previewUrl ? <img src={previewUrl} alt="Generated post preview" className={styles.previewImage} /> : <p>Loading preview...</p>}
                <div className={styles.previewActions}>
                    <button onClick={handleBackToEdit} className={styles.backButton}>Back to Edit</button>
                    <button onClick={handlePostToSocial} disabled={isSubmitting} className={styles.postButton}>
                        {isSubmitting ? 'Posting...' : 'Post to Social Media'}
                    </button>
                </div>
                {message && <p className={styles.message}>{message}</p>}
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.section}>
                {/* Configuration form grid */}
            </div>

            <div className={styles.section}>
                {/* Background selection */}
            </div>

            <div className={styles.section}>
                {/* Caption section */}
            </div>

            {/* MODIFIED: Tagging section removed */}

            <div className={styles.actionsContainer}>
                <div>
                    <button type="button" onClick={handleYoloPost} disabled={isSubmitting} className={styles.yoloButton}>
                        {isSubmitting ? 'Sending...' : 'YOLO Post'}
                    </button>
                    <p className={styles.yoloWarning}>Output may vary - experimental feature.</p>
                </div>
                <button type="button" onClick={handleGeneratePreview} disabled={isSubmitting} className={styles.actionButton}>
                    {isSubmitting ? 'Generating...' : 'Generate Preview'}
                </button>
            </div>
             {message && <p className={styles.message}>{message}</p>}
        </div>
    );
}
