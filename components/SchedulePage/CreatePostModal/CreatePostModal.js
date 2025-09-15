/*
 * ==========================================================
 * COMPONENT: CreatePostModal
 * PAGE: /schedule
 * FILE: /components/SchedulePage/CreatePostModal/CreatePostModal.js
 * ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
import styles from './CreatePostModal.module.css';
import { useAppContext } from '@/app/context/AppContext';

import UpNextForm from '@/components/common/PostCreationForms/UpNextForm/UpNextForm';
import MatchDayForm from '@/components/common/PostCreationForms/MatchDayForm/MatchDayForm';
import SquadForm from '@/components/common/PostCreationForms/SquadForm/SquadForm';
import MatchResultForm, { formatScorersForWebhook } from '@/components/common/PostCreationForms/MatchResultForm/MatchResultForm';

const postTypes = [
    { id: 'upNext', label: 'Up Next', component: UpNextForm, action: 'upNext' },
    { id: 'matchDay', label: 'Match Day', component: MatchDayForm, action: 'match_day_announcement' },
    { id: 'squad', label: 'Squad', component: SquadForm, action: 'squad_announcement' },
    { id: 'result', label: 'Result', component: MatchResultForm, action: 'result' },
];

// Helper function to build a flat payload matching the original components
const buildFlatPayload = (formData, postType, players) => {
    const basePayload = {
        home_team_badge: formData.homeTeamBadge,
        away_team_badge: formData.awayTeamBadge,
        background: formData.selectedBackground,
        caption: formData.caption,
        save_background: formData.saveCustomBackground,
    };

    switch (postType.id) {
        case 'upNext':
            return {
                ...basePayload,
                match_date: formData.match_date,
                kick_off_time: formData.kickOffTime,
                venue: formData.venue,
                team: formData.teamType,
            };
        case 'matchDay':
            return {
                ...basePayload,
                match_date: formData.match_date,
                kick_off_time: formData.kickOffTime,
                venue: formData.venue,
            };
        case 'squad':
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
            return { ...basePayload, players: playersWithSponsors };
        case 'result':
            const homeBadgeObject = appData.badges.find(b => b.Link === formData.homeTeamBadge);
            const isGlannauHome = homeBadgeObject && homeBadgeObject.Name.toLowerCase().includes('glannau');
            const formattedScorers = formatScorersForWebhook(formData.scorers, isGlannauHome);
            return {
                ...basePayload,
                home_team_score: formData.homeTeamScore,
                away_team_score: formData.awayTeamScore,
                ...formattedScorers,
            };
        default:
            return basePayload;
    }
};


export default function CreatePostModal({ isOpen, onClose, scheduleDate, onPostScheduled }) {
    const { appData, authKey } = useAppContext();
    const [selectedPostType, setSelectedPostType] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSelectedPostType(null);
            setMessage('');
        }
    }, [isOpen]);

    const handleFormSubmit = async (formData) => {
        if (!authKey) {
            setMessage('Authorization key is missing.');
            return;
        }

        setIsSubmitting(true);
        setMessage('');
        
        // MODIFIED: Construct a flat payload for the post details
        const postDetailsPayload = buildFlatPayload(formData, selectedPostType, appData.players);

        const payload = {
            action: 'schedule_post',
            schedule_time_utc: scheduleDate.toISOString(),
            post_type: selectedPostType.id,
            image_gen_action: selectedPostType.action,
            ...postDetailsPayload // Spread the flat details into the main payload
        };

        try {
            const response = await fetch('/api/trigger-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to schedule post.');
            
            setMessage('Post scheduled successfully!');
            if(onPostScheduled) onPostScheduled();
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const ActiveForm = selectedPostType?.component;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>&times;</button>
                <h2 className={styles.title}>
                    New Post for {scheduleDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>

                {!selectedPostType ? (
                    <div className={styles.selectorGrid}>
                        {postTypes.map(type => (
                            <button key={type.id} className={styles.typeButton} onClick={() => setSelectedPostType(type)}>
                                {type.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div>
                        <button className={styles.backButton} onClick={() => setSelectedPostType(null)}>
                            &larr; Back to Post Types
                        </button>
                        <h3 className={styles.formTitle}>{selectedPostType.label}</h3>
                        <div className={styles.formWrapper}>
                            <ActiveForm
                                appData={appData}
                                onSubmit={handleFormSubmit}
                                isSubmitting={isSubmitting}
                                // Pass empty handlers for unused props to prevent errors
                                onYoloSubmit={() => {}} 
                                onGenerateCaption={() => {}}
                            />
                        </div>
                    </div>
                )}
                {message && <p className={styles.message}>{message}</p>}
            </div>
        </div>
    );
}
