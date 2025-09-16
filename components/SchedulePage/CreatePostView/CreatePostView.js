/*
 * ==========================================================
 * COMPONENT: CreatePostView
 * PAGE: /schedule
 * FILE: /components/SchedulePage/CreatePostView/CreatePostView.js
 * ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './CreatePostView.module.css';
import { useAppContext } from '@/app/context/AppContext';

// Reusable Forms
import UpNextForm from '@/components/common/PostCreationForms/UpNextForm/UpNextForm';
import MatchDayForm from '@/components/common/PostCreationForms/MatchDayForm/MatchDayForm';
import SquadForm from '@/components/common/PostCreationForms/SquadForm/SquadForm';
import MatchResultForm from '@/components/common/PostCreationForms/MatchResultForm/MatchResultForm';
import { formatScorersForWebhook } from '@/components/common/PostCreationForms/MatchResultForm/MatchResultForm';

// Icons for Post Types
import { UpNextIcon, MatchDayIcon, SquadIcon, ResultIcon } from '@/components/CreatePage/CreatePageIcons';

const postTypes = [
    { id: 'upNext', label: 'Up Next', component: UpNextForm, action: 'upNext', icon: <UpNextIcon /> },
    { id: 'matchDay', label: 'Match Day', component: MatchDayForm, action: 'match_day_announcement', icon: <MatchDayIcon /> },
    { id: 'squad', label: 'Squad', component: SquadForm, action: 'squad_announcement', icon: <SquadIcon /> },
    { id: 'result', label: 'Result', component: MatchResultForm, action: 'result', icon: <ResultIcon /> },
];

const bannerImages = {
    upNext: { src: '/upnext.png', position: 'middleMid' },
    matchDay: { src: '/matchday.png', position: 'top' },
    squad: { src: '/squad.png', position: 'top' },
    result: { src: '/result.png', position: 'top' },
};

const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            slots.push(`${hour}:${minute}`);
        }
    }
    return slots;
};
const timeSlots = generateTimeSlots();

const getNextIntervalTime = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    if (roundedMinutes >= 60) {
        now.setHours(now.getHours() + 1);
        now.setMinutes(0);
    } else {
        now.setMinutes(roundedMinutes);
    }
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

const buildImageGenPayload = (formData, postType, players, badges) => {
    const basePayload = {
        home_team_badge: formData.homeTeamBadge,
        away_team_badge: formData.awayTeamBadge,
        background: formData.selectedBackground,
        caption: formData.caption,
        save_background: formData.saveCustomBackground,
    };
    switch (postType.id) {
        case 'upNext': return { ...basePayload, action: postType.action, match_date: formData.match_date, kick_off_time: formData.kickOffTime, venue: formData.venue, team: formData.teamType };
        case 'matchDay': return { ...basePayload, action: postType.action, match_date: formData.match_date, kick_off_time: formData.kickOffTime, venue: formData.venue };
        case 'squad':
            const playersWithSponsors = formData.selectedPlayers.map(name => {
                if (!name) return null;
                const playerObj = players.find(p => p.fullName === name);
                return { fullName: name, sponsor: playerObj ? playerObj.Sponsor : 'N/A' };
            }).filter(Boolean);
            return { ...basePayload, action: postType.action, players: playersWithSponsors };
        case 'result':
            const homeBadge = badges.find(b => b.Link === formData.homeTeamBadge);
            const isHome = homeBadge && homeBadge.Name.toLowerCase().includes('glannau');
            const scorers = formatScorersForWebhook(formData.scorers, isHome);
            return { ...basePayload, action: postType.action, home_team_score: formData.homeTeamScore, away_team_score: formData.awayTeamScore, ...scorers };
        default: return { ...basePayload, action: postType.action };
    }
};

export default function CreatePostView({ scheduleDate, onPostScheduled, onCancel }) {
    const { appData, authKey } = useAppContext();
    const [view, setView] = useState('CONFIG'); // CONFIG, FORM, PREVIEW
    
    // Config state
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    // FIX: Set "Up Next" as the default post type
    const [selectedPostType, setSelectedPostType] = useState(postTypes[0]);

    // Form & Preview state
    const [formData, setFormData] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // General state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (scheduleDate) {
            setView('CONFIG');
            setSelectedDate(scheduleDate.toISOString().split('T')[0]);
            setSelectedTime(getNextIntervalTime());
            setSelectedPostType(postTypes[0]); // Reset to default on re-entry
            setFormData(null);
            setPreviewUrl('');
            setMessage('');
        }
    }, [scheduleDate]);

    const handleGeneratePreview = async (formPayload) => {
        setIsSubmitting(true);
        setMessage('');
        setFormData(formPayload);
        const imageGenPayload = buildImageGenPayload(formPayload, selectedPostType, appData.players, appData.badges);
        try {
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(imageGenPayload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to generate preview.');
            const imageUrl = result[0]?.data?.data?.content;
            if (!imageUrl) throw new Error("Image URL not found in API response.");
            setPreviewUrl(imageUrl);
            setView('PREVIEW');
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleSchedulePost = async () => {
        setIsSubmitting(true);
        setMessage('');
        const [hours, minutes] = selectedTime.split(':');
        const finalScheduleDate = new Date(selectedDate);
        finalScheduleDate.setUTCHours(hours, minutes, 0, 0);
        const schedulePayload = {
            action: 'schedule_post',
            schedule_time_utc: finalScheduleDate.toISOString(),
            post_type: selectedPostType.id,
            image_gen_action: selectedPostType.action,
            ...buildImageGenPayload(formData, selectedPostType, appData.players, appData.badges)
        };
        try {
            const response = await fetch('/api/trigger-workflow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(schedulePayload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to schedule post.');
            setMessage('Post scheduled successfully!');
            setTimeout(onPostScheduled, 1500);
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const ActiveForm = selectedPostType?.component;
    const activeBanner = selectedPostType ? bannerImages[selectedPostType.id] : null;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.viewHeader}>
                <h1 className={styles.viewTitle}>Schedule New Post</h1>
                {/* FIX: Added arrow icon to button */}
                <button onClick={onCancel} className={styles.cancelButton}>&#x2190; Back to Calendar</button>
            </div>

            {activeBanner && (
                <div className={styles.bannerContainer}>
                    <Image
                        key={selectedPostType.id}
                        src={activeBanner.src}
                        alt={`${selectedPostType.label} Banner`}
                        fill
                        priority
                        placeholder="blur"
                        blurDataURL={activeBanner.src}
                        className={`${styles.bannerImage} ${styles[activeBanner.position]}`}
                    />
                </div>
            )}
            
            {view === 'CONFIG' && (
                <section className={styles.section}>
                    {/* FIX: Reordered sections and added new 'Select Post Type' header */}
                    <h3 className={styles.subHeader}>Select Post Type</h3>
                    <div className={styles.selectorGrid}>
                        {postTypes.map(type => (
                            <button key={type.id} className={`${styles.typeButton} ${selectedPostType?.id === type.id ? styles.selectedType : ''}`} onClick={() => setSelectedPostType(type)}>
                                <span className={styles.typeIcon}>{type.icon}</span>
                                {type.label}
                            </button>
                        ))}
                    </div>
                    <div className={styles.configForm}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="schedule-date">Date</label>
                            <input id="schedule-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="schedule-time">Time</label>
                            <select id="schedule-time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
                                {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className={styles.actions}>
                         {/* FIX: Updated button text and added arrow icon */}
                         <button className={styles.nextButton} onClick={() => setView('FORM')} disabled={!selectedPostType}>Add Details &#x2192;</button>
                    </div>
                </section>
            )}

            {view === 'FORM' && (
                <section className={styles.section}>
                    {/* FIX: Removed section title */}
                    <div className={styles.formWrapper}>
                        <ActiveForm appData={appData} onSubmit={handleGeneratePreview} isSubmitting={isSubmitting} onYoloSubmit={()=>{}} onGenerateCaption={()=>{}} />
                    </div>
                     <div className={`${styles.actions} ${styles.formActions}`}>
                        <button onClick={() => setView('CONFIG')} className={styles.backButton}>&larr; Back to Config</button>
                    </div>
                </section>
            )}

            {view === 'PREVIEW' && (
                <section className={styles.section}>
                    {/* FIX: Removed section title */}
                    <div className={styles.previewLayout}>
                        <div className={styles.previewImageWrapper}>
                             {isSubmitting && <div className={styles.imageOverlay}>{message ? message : 'Scheduling...'}</div>}
                            <img src={previewUrl} alt="Generated Preview" className={styles.previewImage} />
                        </div>
                        <div className={styles.previewControls}>
                            <div className={styles.confirmDetails}>
                                <p><strong>Scheduling for:</strong></p>
                                <p>{new Date(selectedDate).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {selectedTime}</p>
                            </div>
                            <div className={styles.actions}>
                                <button onClick={() => setView('FORM')} className={styles.backButton} disabled={isSubmitting}>&larr; Back to Edit</button>
                                <button className={styles.scheduleButton} onClick={handleSchedulePost} disabled={isSubmitting}>
                                    {isSubmitting ? 'Scheduling...' : 'Schedule Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}
             {message && <p className={styles.message}>{message}</p>}
        </div>
    );
}
