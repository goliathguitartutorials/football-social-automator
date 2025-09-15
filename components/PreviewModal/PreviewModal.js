/*
 * ==========================================================
 * COMPONENT: PreviewModal
 * PAGE: /schedule
 * FILE: /components/PreviewModal/PreviewModal.js
 ==========================================================
 */
import { useState } from 'react';
import styles from './PreviewModal.module.css';
import { EditIcon, DeleteIcon } from '../AssetDetailsModal/AssetDetailsModalIcons';
import { CalendarIcon as RescheduleIcon } from '../SchedulePage/SchedulePageIcons';

export default function PreviewModal({ post, onClose, onManagePost }) {
  if (!post) return null;

  const [currentView, setCurrentView] = useState('details'); // details, edit_caption, confirm_delete, reschedule
  const [editedCaption, setEditedCaption] = useState(post.post_caption);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState(post.scheduled_time_utc);

  const handleUpdateCaption = async () => {
    // Add logic to call onManagePost to update the caption
    setCurrentView('details');
  };

  const handleDelete = async () => {
    // Add logic to call onManagePost to delete the post
  };

  const handleReschedule = async () => {
    // Add logic to call onManagePost to reschedule the post
    setCurrentView('details');
  };

  const renderContent = () => {
    if (currentView === 'confirm_delete') {
      return (
        <div className={styles.confirmationView}>
          <h3>Confirm Deletion</h3>
          <p>Are you sure you want to delete this scheduled post?</p>
          <div className={styles.viewActions}>
            <button onClick={() => setCurrentView('details')} className={styles.cancelButton}>Cancel</button>
            <button onClick={handleDelete} className={`${styles.confirmButton} ${styles.deleteButton}`}>Yes, Delete</button>
          </div>
        </div>
      );
    }

    if (currentView === 'edit_caption') {
      return (
        <div>
          <h3>Edit Caption</h3>
          <textarea className={styles.captionInput} value={editedCaption} onChange={(e) => setEditedCaption(e.target.value)} />
          <div className={styles.viewActions}>
            <button onClick={() => setCurrentView('details')} className={styles.cancelButton}>Cancel</button>
            <button onClick={handleUpdateCaption} className={styles.confirmButton}>Save</button>
          </div>
        </div>
      );
    }

    if (currentView === 'reschedule') {
      return (
        <div>
          <h3>Reschedule Post</h3>
          <input type="datetime-local" className={styles.rescheduleInput} value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
          <div className={styles.viewActions}>
            <button onClick={() => setCurrentView('details')} className={styles.cancelButton}>Cancel</button>
            <button onClick={handleReschedule} className={styles.confirmButton}>Reschedule</button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <img src={post.image_url} alt="Scheduled Post" className={styles.modalImage} />
        <p className={styles.modalCaption}>{post.post_caption}</p>
        <div className={styles.mainActions}>
          <button onClick={() => setCurrentView('edit_caption')} className={styles.actionButton}><EditIcon /><span>Edit</span></button>
          <button onClick={() => setCurrentView('reschedule')} className={styles.actionButton}><RescheduleIcon /><span>Reschedule</span></button>
          <button onClick={() => setCurrentView('confirm_delete')} className={`${styles.actionButton} ${styles.deleteButtonAction}`}><DeleteIcon /><span>Delete</span></button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        {renderContent()}
      </div>
    </div>
  );
}
