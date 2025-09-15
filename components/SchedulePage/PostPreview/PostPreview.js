/*
 * ==========================================================
 * COMPONENT: PostPreview
 * PAGE: /schedule
 * FILE: /components/SchedulePage/PostPreview/PostPreview.js
 * ==========================================================
 */
import styles from './PostPreview.module.css';

export default function PostPreview({ post, onClick, isListView = false, isMobileCalendarView = false }) {
  if (!post) return null;

  const scheduledTime = new Date(post.scheduled_time_utc).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Render a special compact view for the mobile calendar grid
  if (isMobileCalendarView) {
    return (
      <div className={styles.mobileCalendarPreview} onClick={() => onClick(post)}>
        <span className={styles.postTime}>{scheduledTime}</span>
        <p className={styles.postCaption}>{post.post_caption}</p>
      </div>
    );
  }

  // Render the default view for desktop calendar and list view
  return (
    <div className={`${styles.postPreview} ${isListView ? styles.listView : ''}`} onClick={() => onClick(post)}>
      <img src={post.image_url} alt="Post preview" className={styles.previewImage} />
      <div className={styles.postDetails}>
        <span className={styles.postTime}>{scheduledTime}</span>
        <p className={styles.postCaption}>{post.post_caption}</p>
      </div>
    </div>
  );
}
