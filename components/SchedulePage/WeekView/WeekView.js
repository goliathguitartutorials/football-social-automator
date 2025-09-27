/*
 * ==========================================================
 * COMPONENT: WeekView
 * PAGE: /schedule
 * FILE: /components/SchedulePage/WeekView/WeekView.js
 * ==========================================================
 */
'use client';
import styles from './WeekView.module.css';
import PostPreview from '../PostPreview/PostPreview';
import MatchPreview from '../MatchPreview/MatchPreview'; // Import the new component

export default function WeekView({ currentDate, events, onPostClick, onMatchClick, onNewEventClick }) {

    const getStartOfWeek = (date) => {
        const day = date.getDay();
        const diff = date.getDate() - (day === 0 ? 6 : day - 1);
        return new Date(date.getFullYear(), date.getMonth(), diff);
    };

    const renderDays = () => {
        const days = [];
        const startOfWeek = getStartOfWeek(currentDate);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
            
            // MODIFIED: Filter a mixed list of events
            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.type === 'post' ? event.scheduled_time_utc : `${event.matchDate}T${event.matchTime || '00:00'}`);
                return eventDate.toDateString() === date.toDateString();
            });
            
            days.push(
                <div key={date.toISOString()} className={styles.day}>
                    <span>{date.getDate()}</span>
                    <div className={styles.posts}>
                        {dayEvents.map(event => (
                            // MODIFIED: Conditionally render a Post or Match preview
                            event.type === 'post' ? (
                                <PostPreview key={event.id} post={event} onClick={onPostClick} />
                            ) : (
                                <MatchPreview key={event.matchId} match={event} onClick={onMatchClick} />
                            )
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className={styles.calendarGrid}>
            <div className={styles.dayName}>Mon</div>
            <div className={styles.dayName}>Tue</div>
            <div className={styles.dayName}>Wed</div>
            <div className={styles.dayName}>Thu</div>
            <div className={styles.dayName}>Fri</div>
            <div className={styles.dayName}>Sat</div>
            <div className={styles.dayName}>Sun</div>
            {renderDays()}
        </div>
    );
}
