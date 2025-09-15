/*
 * ==========================================================
 * COMPONENT: PostPreview
 * PAGE: /schedule
 * FILE: /components/PostPreview/PostPreview.js
 ==========================================================
 */
import styles from './PostPreview.module.css';

export default function PostPreview({ post, onClick, isListView = false }) {
  if (!post) return null;

  const scheduledTime = new Date(post.scheduled_time_utc).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

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
