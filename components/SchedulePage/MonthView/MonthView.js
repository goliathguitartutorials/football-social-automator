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
import { MoreIcon, PlusIcon } from '../SchedulePageIcons';

export default function MonthView({ currentDate, posts, onPostClick, onMoreClick, onDayClick, onNewPostClick, isMobile = false }) {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();
  
  const maxPosts = isMobile ? 3 : 2;

  const renderDays = () => {
    const days = [];
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(<div key={`empty-${i}`} className={`${styles.day} ${styles.emptyDay}`}></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dayPosts = posts.filter(post => {
        const postDate = new Date(post.scheduled_time_utc);
        return postDate.getDate() === date.getDate() &&
               postDate.getMonth() === date.getMonth() &&
               postDate.getFullYear() === date.getFullYear();
      });

      const dayProps = {};
      if (isMobile && onDayClick) {
        dayProps.onClick = () => onDayClick(date);
      }

      days.push(
        <div key={date.toISOString()} className={styles.day} {...dayProps}>
          {!isMobile && (
            <button className={styles.addPostButton} onClick={() => onNewPostClick(date)}>
              <PlusIcon />
            </button>
          )}
          <span>{date.getDate()}</span>
          <div className={styles.posts}>
            {dayPosts.slice(0, maxPosts).map(post => (
              <PostPreview 
                key={post.id} 
                post={post} 
                onClick={!isMobile ? onPostClick : () => {}}
                isMobileCalendarView={isMobile} 
              />
            ))}
            {dayPosts.length > maxPosts && (
              <button
                className={styles.moreButton}
                onClick={isMobile ? undefined : (e) => { e.stopPropagation(); onMoreClick(date); }}
              >
                <MoreIcon />
                {!isMobile && <span>{dayPosts.length - maxPosts} more</span>}
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
