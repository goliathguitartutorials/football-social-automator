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

// MODIFIED: Added `currentDate` prop to handle adding new events on empty days.
export default function MobileScheduleView({ events, onPostClick, onMatchClick, onNewEventClick, showDateHeaders = true, currentDate }) {
    
    const groupedEvents = (events || []).reduce((acc, event) => {
        const date = new Date(event.type === 'post' ? event.scheduled_time_utc : `${event.matchDate}T00:00:00Z`);
        const dateKey = date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(event);
        return acc;
    }, {});

    const sortedDateKeys = Object.keys(groupedEvents).sort((a, b) => new Date(a) - new Date(b));

    // NEW: A reusable component for the "Add Event" button.
    const AddEventButton = ({ date }) => (
        <button className={styles.newPostButton} onClick={() => onNewEventClick(date)}>
            <PlusIcon />
            <span>Add an event...</span>
        </button>
    );

    return (
        <div className={styles.mobileView}>
            {sortedDateKeys.length === 0 && (
                 // MODIFIED: The "no events" message now includes the Add Event button.
                <div className={styles.noEventsContainer}>
                    <p className={styles.noEventsMessage}>No events scheduled for this period.</p>
                    <AddEventButton date={currentDate} />
                </div>
            )}
            {sortedDateKeys.map(dateKey => {
                const date = new Date(`${dateKey}T00:00:00Z`);
                const eventsForDay = groupedEvents[dateKey];
                const displayDate = date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                
                return (
                    <div key={dateKey} className={styles.dayGroup}>
                        {showDateHeaders && <h3>{displayDate}</h3>}
                        <div className={styles.postsList}>
                            {eventsForDay.map(event => (
                                event.type === 'post' ? (
                                    <PostPreview key={event.id} post={event} onClick={onPostClick} isListView={true} />
                                ) : (
                                    <MatchPreview key={event.matchId} match={event} onClick={onMatchClick} isListView={true} />
                                )
                            ))}
                            {/* MODIFIED: Using the new reusable button component */}
                            <AddEventButton date={date} />
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
