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
import { PlusIcon } from '../SchedulePageIcons';

export default function MobileScheduleView({ posts, postsByDate, onPostClick, onNewPostClick, showDateHeaders = true }) {
  
  // Use pre-grouped posts if provided (for Day View), otherwise group them (for List View)
  const groupedPosts = postsByDate ? postsByDate : (posts || []).reduce((acc, post) => {
    const date = new Date(post.scheduled_time_utc);
    const dateKey = date.toISOString().split('T')[0]; // Use YYYY-MM-DD for stable keys
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(post);
    return acc;
  }, {});

  const sortedDateKeys = Object.keys(groupedPosts).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className={styles.mobileView}>
      {sortedDateKeys.map(dateKey => {
        const date = new Date(dateKey);
        const postsForDay = groupedPosts[dateKey];
        const displayDate = date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        return (
          <div key={dateKey} className={styles.dayGroup}>
            {showDateHeaders && <h3>{displayDate}</h3>}
            <div className={styles.postsList}>
              {postsForDay.map(post => (
                <PostPreview key={post.id} post={post} onClick={onPostClick} isListView={true} />
              ))}
              <button className={styles.newPostButton} onClick={() => onNewPostClick(date)}>
                <PlusIcon />
                <span>Schedule a post...</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  );
}
