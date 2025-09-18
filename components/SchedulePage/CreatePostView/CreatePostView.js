/*
 * ==========================================================
 * COMPONENT: CreatePostView
 * PAGE: Schedule Page
 * FILE: /components/SchedulePage/CreatePostView/CreatePostView.js
 * ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './CreatePostView.module.css';
import { useAppContext } from '@/app/context/AppContext';
import PostPreviewAndEditView from '../PostPreviewAndEditView/PostPreviewAndEditView';

// Reusable Forms
import UpNextForm from '@/components/common/PostCreationForms/UpNextForm/UpNextForm';
import MatchDayForm from '@/components/common/PostCreationForms/MatchDayForm/MatchDayForm';
import SquadForm from '@/components/common/PostCreationForms/SquadForm/SquadForm';
import MatchResultForm from '@/components/common/PostCreationForms/MatchResultForm/MatchResultForm';
import CustomImageForm from '@/components/common/PostCreationForms/CustomImageForm/CustomImageForm';

// Icons
import { UpNextIcon, MatchDayIcon, SquadIcon, ResultIcon, CustomImageIcon } from '@/components/CreatePage/CreatePageIcons';
import { ArrowLeftIcon, ArrowRightIcon } from './CreatePostViewIcons';

const postTypes = [
    { id: 'upNext', label: 'Up Next', component: UpNextForm, action: 'upNext', icon: <UpNextIcon /> },
    { id: 'matchDay', label: 'Match Day', component: MatchDayForm, action: 'match_day_announcement', icon: <MatchDayIcon /> },
    { id: 'squad', label: 'Squad', component: SquadForm, action: 'squad_announcement', icon: <SquadIcon /> },
    { id: 'result', label: 'Result', component: MatchResultForm, action: 'result', icon: <ResultIcon /> },
    { id: 'customImage', label: 'Custom Image', component: CustomImageForm, action: 'custom', icon: <CustomImageIcon /> },
];

const bannerImages = {
    upNext: { src: '/upnext.png', position: 'middleMid' },
    matchDay: { src: '/matchday.png', position: 'top' },
    squad: { src: '/squad.png', position: 'top' },
    result: { src: '/result.png', position: 'top' },
    customImage: { src: '/custom.png', position: 'middleHighMore' },
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

const buildImageGenPayload = (formData, postType) => {
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
        case 'squad': return { ...basePayload, action: postType.action, players: formData.selectedPlayersWithSponsors };
        case 'result': return { ...basePayload, action: postType.action, home_team_score: formData.homeTeamScore, away_team_score: formData.awayTeamScore, ...formData.scorersForWebhook };
        default: return { ...basePayload, action: postType.action };
    }
};

export default function CreatePostView({ scheduleDate, onPostScheduled, onCancel }) {
    const { appData, authKey } = useAppContext();
    const [view, setView] = useState('CONFIG');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedPostType, setSelectedPostType] = useState(postTypes[0]);
    const [formData, setFormData] = useState({});
    const [previewUrl, setPreviewUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

    useEffect(() => {
        if (scheduleDate) {
            setView('CONFIG');
            const year = scheduleDate.getFullYear();
            const month = (scheduleDate.getMonth() + 1).toString().padStart(2, '0');
            const day = scheduleDate.getDate().toString().padStart(2, '0');
            setSelectedDate(`${year}-${month}-${day}`);
            setSelectedTime(getNextIntervalTime());
            setSelectedPostType(postTypes[0]);
            setFormData({ teamType: 'First Team', saveCustomBackground: true });
            setPreviewUrl('');
            setMessage('');
        }
    }, [scheduleDate]);

    const handleGenerateCaption = async (gameInfo) => {
        setIsGeneratingCaption(true);
        setFormData(prev => ({ ...prev, caption: '' }));
        const payload = { action: selectedPostType.id, gameInfo };
        try {
            const response = await fetch('/api/generate-caption', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(payload) });
            if (!response.ok) { throw new Error('Failed to generate caption.'); }
            const result = await response.json();
            const newCaption = result.caption || 'Sorry, could not generate a caption.';
            setFormData(prev => ({ ...prev, caption: newCaption }));
        } catch (err) {
            setFormData(prev => ({ ...prev, caption: `Error: ${err.message}` }));
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const handleGeneratePreview = async (formPayload) => {
        setIsSubmitting(true);
        setMessage('');
        setFormData(formPayload);
        const imageGenPayload = buildImageGenPayload(formPayload, selectedPostType);
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
    
    const handleCustomImageSubmit = async ({ imageFile, caption, action }) => {
        setIsSubmitting(true);
        setMessage('');
        const postId = `post_${new Date().getTime()}`;
        const localDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
        const schedule_time_utc = localDateTime.toISOString();
        const apiFormData = new FormData();
        apiFormData.append('post_id', postId);
        apiFormData.append('image', imageFile);
        apiFormData.append('caption', caption);
        apiFormData.append('schedule_time_utc', schedule_time_utc);
        apiFormData.append('action', action);
        try {
            const response = await fetch('/api/schedule-custom-post', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authKey}` },
                body: apiFormData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to process post.');
            setMessage('Post scheduled successfully!');
            setTimeout(onPostScheduled, 1500);
        } catch (err) {
            setMessage(`Error: ${err.message}`);
            setIsSubmitting(false);
        }
    };

    const handleSchedulePost = async ({ caption, date, time }) => {
        setIsSubmitting(true);
        setMessage('');
        const localDateTime = new Date(`${date}T${time}:00`);
        const schedule_time_utc = localDateTime.toISOString();
        const postId = `post_${new Date().getTime()}`;
        const schedulePayload = {
            action: 'schedule_post',
            post_id: postId,
            schedule_time_utc: schedule_time_utc,
            post_type: selectedPostType.id,
            image_url: previewUrl,
            caption: caption
        };
        try {
            const response = await fetch('/api/schedule-manager', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify(schedulePayload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to schedule post.');
            setMessage('Post scheduled successfully!');
            setTimeout(onPostScheduled, 1500);
        } catch (err) {
            setMessage(`Error: ${err.message}`);
            setIsSubmitting(false);
        }
    };

    const ActiveForm = selectedPostType?.component;
    const activeBanner = selectedPostType ? bannerImages[selectedPostType.id] : null;

    if (view === 'PREVIEW') {
        const localDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
        const previewPostData = {
            image_url: previewUrl,
            post_caption: formData.caption,
            scheduled_time_utc: localDateTime.toISOString(),
        };
        return (
            <PostPreviewAndEditView
                post={previewPostData}
                mode="create"
                onClose={() => setView('FORM')}
                onSchedule={handleSchedulePost}
            />
        );
    }
    
    return (
        <div className={styles.pageContainer}>
            <div className={styles.viewHeader}>
                <h1 className={styles.viewTitle}>Schedule New Post</h1>
                <button onClick={onCancel} className={styles.cancelButton}>
                    <ArrowLeftIcon /> Back to Calendar
                </button>
            </div>

            {activeBanner && (
                <div className={styles.bannerContainer}>
                    <Image
                        key={selectedPostType.id}
                        src={activeBanner.src}
                        alt={`${selectedPostType.label} Banner`}
                        fill priority
                        placeholder="blur"
                        blurDataURL={activeBanner.src}
                        className={`${styles.bannerImage} ${styles[activeBanner.position]}`}
                    />
                </div>
            )}

            <section className={styles.section}>
                <h3 className={styles.subHeader}>Select Post Type</h3>
                <div className={styles.selectorGrid}>
                    {postTypes.map(type => (
                        <button key={type.id} className={`${styles.typeButton} ${selectedPostType?.id === type.id ? styles.selectedType : ''}`} onClick={() => setSelectedPostType(type)}>
                            <span className={styles.typeIcon}>{type.icon}</span>
                            {type.label}
                        </button>
                    ))}
                </div>
            </section>

            {selectedPostType.id === 'customImage' ? (
                <section className={styles.section}>
                    <div className={styles.formWrapper}>
                        <CustomImageForm
                            context="schedule"
                            onSubmit={handleCustomImageSubmit}
                            isSubmitting={isSubmitting}
                            selectedDate={selectedDate}
                            onDateChange={(e) => setSelectedDate(e.target.value)}
                            selectedTime={selectedTime}
                            onTimeChange={(e) => setSelectedTime(e.target.value)}
                            timeSlots={timeSlots}
                        />
                    </div>
                </section>
            ) : (
                <>
                    {view === 'CONFIG' && (
                        <section className={styles.section}>
                            <h3 className={styles.subHeader}>Date & Time</h3>
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
                                 <button className={styles.nextButton} onClick={() => setView('FORM')} disabled={!selectedPostType}>
                                     Add Details <ArrowRightIcon />
                                 </button>
                            </div>
                        </section>
                    )}
                    {view === 'FORM' && (
                        <section className={styles.section}>
                            <div className={styles.formWrapper}>
                                <ActiveForm
                                    appData={appData}
                                    initialData={formData}
                                    onSubmit={handleGeneratePreview}
                                    onGenerateCaption={handleGenerateCaption}
                                    isSubmitting={isSubmitting}
                                    isGeneratingCaption={isGeneratingCaption}
                                />
                            </div>
                            <div className={`${styles.actions} ${styles.formActions}`}>
                                <button onClick={() => setView('CONFIG')} className={styles.backButton}>
                                    <ArrowLeftIcon /> Back to Config
                                </button>
                            </div>
                        </section>
                    )}
                </>
            )}
            
            {message && <p className={styles.message}>{message}</p>}
        </div>
    );
}
