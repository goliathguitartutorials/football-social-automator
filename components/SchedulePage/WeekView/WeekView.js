/*
 * ==========================================================
 * COMPONENT: WeekView
 * PAGE: /schedule
 * FILE: /components/SchedulePage/WeekView/WeekView.js
 ==========================================================
 */
'use client';

import styles from './WeekView.module.css';
import PostPreview from '../../PostPreview/PostPreview';

export default function WeekView({ currentDate, posts, onPostClick }) {

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
      const dayPosts = posts.filter(post => {
        const postDate = new Date(post.scheduled_time_utc);
        return postDate.getDate() === date.getDate() &&
               postDate.getMonth() === date.getMonth() &&
               postDate.getFullYear() === date.getFullYear();
      });
      
      days.push(
        <div key={date.toISOString()} className={styles.day}>
          <span>{date.getDate()}</span>
          <div className={styles.posts}>
            {dayPosts.map(post => (
              <PostPreview key={post.id} post={post} onClick={onPostClick} />
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
