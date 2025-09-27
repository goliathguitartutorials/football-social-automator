/*
 * ==========================================================
 * COMPONENT: MonthView
 * PAGE: /schedule
 * FILE: /components/SchedulePage/MonthView/MonthView.js
 * ==========================================================
 */
'use client';

import styles from './MonthView.module.css';
import PostPreview from '../PostPreview/PostPreview';
import MatchPreview from '../MatchPreview/MatchPreview'; // Import the new component
import { MoreIcon, PlusIcon } from '../SchedulePageIcons';

export default function MonthView({ currentDate, events, onPostClick, onMatchClick, onMoreClick, onDayClick, onNewEventClick, isMobile = false }) {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();
    
    const maxEvents = isMobile ? 3 : 2;

    const renderDays = () => {
        const days = [];
        const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

        for (let i = 0; i < adjustedStartDay; i++) {
            days.push(<div key={`empty-${i}`} className={`${styles.day} ${styles.emptyDay}`}></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            
            // MODIFIED: Filter a mixed list of events instead of just posts
            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.type === 'post' ? event.scheduled_time_utc : `${event.matchDate}T${event.matchTime || '00:00'}`);
                return eventDate.toDateString() === date.toDateString();
            });

            const dayProps = {};
            if (isMobile && onDayClick) {
                dayProps.onClick = () => onDayClick(date);
            }

            days.push(
                <div key={date.toISOString()} className={styles.day} {...dayProps}>
                    {!isMobile && (
                        <button className={styles.addPostButton} onClick={() => onNewEventClick(date)}>
                            <PlusIcon />
                        </button>
                    )}
                    <span>{i}</span>
                    <div className={styles.posts}>
                        {dayEvents.slice(0, maxEvents).map(event =>
                            // MODIFIED: Conditionally render a Post or Match preview
                            event.type === 'post' ? (
                                <PostPreview 
                                    key={event.id} 
                                    post={event} 
                                    onClick={!isMobile ? onPostClick : () => {}}
                                    isMobileCalendarView={isMobile} 
                                />
                            ) : (
                                <MatchPreview 
                                    key={event.matchId} 
                                    match={event} 
                                    onClick={onMatchClick} 
                                />
                            )
                        )}
                        {dayEvents.length > maxEvents && (
                            <button
                                className={styles.moreButton}
                                onClick={isMobile ? undefined : (e) => { e.stopPropagation(); onMoreClick(date); }}
                            >
                                <MoreIcon />
                                {!isMobile && <span>{dayEvents.length - maxEvents} more</span>}
                            </button>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className={`${styles.calendarGrid} ${isMobile ? styles.mobileGrid : ''}`}>
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
