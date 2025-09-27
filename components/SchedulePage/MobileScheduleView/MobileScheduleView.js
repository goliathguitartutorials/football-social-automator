/*
 * ==========================================================
 * COMPONENT: MobileScheduleView
 * PAGE: /schedule
 * FILE: /components/SchedulePage/MobileScheduleView/MobileScheduleView.js
 * ==========================================================
 */
'use client';
import styles from './MobileScheduleView.module.css';
import PostPreview from '../PostPreview/PostPreview';
import MatchPreview from '../MatchPreview/MatchPreview';
import { PlusIcon } from '../SchedulePageIcons';

export default function MobileScheduleView({ events, onPostClick, onMatchClick, onNewEventClick, showDateHeaders = true }) {
    
    // MODIFIED: Logic to group a mixed list of events by date
    const groupedEvents = (events || []).reduce((acc, event) => {
        // Use UTC date to prevent timezone issues with grouping
        const date = new Date(event.type === 'post' ? event.scheduled_time_utc : `${event.matchDate}T00:00:00Z`);
        const dateKey = date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(event);
        return acc;
    }, {});

    const sortedDateKeys = Object.keys(groupedEvents).sort((a, b) => new Date(a) - new Date(b));

    return (
        <div className={styles.mobileView}>
            {sortedDateKeys.length === 0 && (
                 <p className={styles.noEventsMessage}>No events scheduled for this period.</p>
            )}
            {sortedDateKeys.map(dateKey => {
                // Re-create date object from UTC key to ensure correct local display
                const date = new Date(`${dateKey}T00:00:00Z`);
                const eventsForDay = groupedEvents[dateKey];
                const displayDate = date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                
                return (
                    <div key={dateKey} className={styles.dayGroup}>
                        {showDateHeaders && <h3>{displayDate}</h3>}
                        <div className={styles.postsList}>
                            {eventsForDay.map(event => (
                                // MODIFIED: Conditionally render a Post or Match preview
                                event.type === 'post' ? (
                                    <PostPreview key={event.id} post={event} onClick={onPostClick} isListView={true} />
                                ) : (
                                    <MatchPreview key={event.matchId} match={event} onClick={onMatchClick} isListView={true} />
                                )
                            ))}
                            <button className={styles.newPostButton} onClick={() => onNewEventClick(date)}>
                                <PlusIcon />
                                <span>Add an event...</span>
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
