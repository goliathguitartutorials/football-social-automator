/*
 * ==========================================================
 * COMPONENT: MobileScheduleView
 * PAGE: /schedule
 * FILE: /components/SchedulePage/MobileScheduleView/MobileScheduleView.js
 ==========================================================
 */
'use client';
import { useEffect, useRef } from 'react';
import styles from './MobileScheduleView.module.css';
import PostPreview from '../PostPreview/PostPreview'; // MODIFIED PATH

export default function MobileScheduleView({ posts, onPostClick, scrollToDate }) {
  const groupedPosts = posts.reduce((acc, post) => {
    const date = new Date(post.scheduled_time_utc).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(post);
    return acc;
  }, {});

  const dayRefs = useRef({});

  useEffect(() => {
    if (scrollToDate) {
      const dateString = new Date(scrollToDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (dayRefs.current[dateString]) {
        dayRefs.current[dateString].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [scrollToDate]);

  return (
    <div className={styles.mobileView}>
      {Object.keys(groupedPosts).map(date => (
        <div key={date} ref={el => dayRefs.current[date] = el} className={styles.dayGroup}>
          <h3>{date}</h3>
          <div className={styles.postsList}>
            {groupedPosts[date].map(post => (
              <PostPreview key={post.id} post={post} onClick={onPostClick} isListView={true} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
