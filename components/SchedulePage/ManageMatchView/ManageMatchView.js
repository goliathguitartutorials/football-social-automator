/*
 * ==========================================================
 * COMPONENT: ManageMatchView
 * PAGE: /schedule
 * FILE: /components/SchedulePage/ManageMatchView/ManageMatchView.js
 * ==========================================================
 */
'use client';

import styles from './ManageMatchView.module.css';
import AddMatchForm from './AddMatchForm/AddMatchForm';
import { ArrowLeftIcon } from '../CreatePostView/CreatePostViewIcons';

export default function ManageMatchView({ initialData, onComplete, onCancel }) {
    const isEditMode = initialData && initialData.matchId;

    return (
        <div className={styles.wrapper}>
            <div className={styles.topHeader}>
                <h1 className={styles.viewTitle}>{isEditMode ? 'Edit Match' : 'Schedule New Match'}</h1>
                <button onClick={onCancel} className={styles.cancelButton}>
                    <ArrowLeftIcon /> Back to Calendar
                </button>
            </div>

            <div className={styles.contentArea}>
                <div className={styles.formWrapper}>
                    <AddMatchForm
                        initialData={initialData}
                        onMatchAdded={onComplete}
                        onCancel={onCancel}
                    />
                </div>
            </div>
        </div>
    );
}
