/*
 * ==========================================================
 * COMPONENT: SchedulePage
 * PAGE: /schedule
 * FILE: /components/SchedulePage/SchedulePage.js
 * ==========================================================
 */
'use client';
import { useState } from 'react';
import styles from './SchedulePage.module.css';
import PreviewModal from './PreviewModal/PreviewModal';
import CreatePostView from './CreatePostView/CreatePostView'; // UPDATED: Import new view
import MobileScheduleView from './MobileScheduleView/MobileScheduleView';
import { useWindowSize } from '@/hooks/useWindowSize';
import { CalendarIcon, DayIcon, ListIcon } from './SchedulePageIcons';
import MonthView from './MonthView/MonthView';
import WeekView from './WeekView/WeekView';

export default function SchedulePage({ appData, onDataRefresh }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedPost, setSelectedPost] = useState(null);
    const [newPostDate, setNewPostDate] = useState(null);
    const [viewMode, setViewMode] = useState('calendar'); // calendar, list, day
    const [viewType, setViewType] = useState('month'); // month, week
    const [dayViewDate, setDayViewDate] = useState(new Date());
    
    // NEW: State to manage switching to the creation view
    const [isCreatingPost, setIsCreatingPost] = useState(false);

    const { width } = useWindowSize();
    const isMobile = width && width <= 768;

    const openPreviewModal = (post) => setSelectedPost(post);
    const closePreviewModal = () => setSelectedPost(null);

    // UPDATED: Handlers to enter and exit the new creation view
    const enterCreateMode = (date) => {
        setNewPostDate(date);
        setIsCreatingPost(true);
    };
    
    const exitCreateMode = () => {
        setIsCreatingPost(false);
        setNewPostDate(null);
    };

    const handlePostScheduled = () => {
        onDataRefresh(); // Refresh the data to show the new post
        exitCreateMode();   // Return to the calendar view
    };

    const handleDayClick = (date) => {
        setDayViewDate(date);
        setViewMode('day');
    };

    const getStartOfWeek = (date) => {
        const day = date.getDay();
        const diff = date.getDate() - (day === 0 ? 6 : day - 1);
        return new Date(date.getFullYear(), date.getMonth(), diff);
    };

    const getEndOfWeek = (date) => {
        const startOfWeek = getStartOfWeek(date);
        const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek;
    };

    const scheduledPosts = appData?.scheduledPosts || [];

    const currentPosts = scheduledPosts.filter(post => {
        const postDate = new Date(post.scheduled_time_utc);
        if (viewType === 'month') {
            return postDate.getFullYear() === currentDate.getFullYear() &&
                   postDate.getMonth() === currentDate.getMonth();
        } else if (viewType === 'week') {
            const start = getStartOfWeek(currentDate);
            const end = getEndOfWeek(currentDate);
            return postDate >= start && postDate <= end;
        }
        return false;
    });

    const handlePrev = () => {
        if (viewMode === 'day') {
            setDayViewDate(new Date(dayViewDate.getFullYear(), dayViewDate.getMonth(), dayViewDate.getDate() - 1));
        } else if (viewType === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else if (viewType === 'week') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
        }
    };

    const handleNext = () => {
        if (viewMode === 'day') {
            setDayViewDate(new Date(dayViewDate.getFullYear(), dayViewDate.getMonth(), dayViewDate.getDate() + 1));
        } else if (viewType === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else if (viewType === 'week') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
        }
    };

    const renderActiveView = () => {
        if (viewMode === 'list') {
            return <MobileScheduleView posts={scheduledPosts} onPostClick={openPreviewModal} onNewPostClick={enterCreateMode} showDateHeaders={true} />;
        }
        if (viewMode === 'day') {
            const dayPosts = scheduledPosts.filter(post => {
                const postDate = new Date(post.scheduled_time_utc);
                return postDate.getDate() === dayViewDate.getDate() && postDate.getMonth() === dayViewDate.getMonth() && postDate.getFullYear() === dayViewDate.getFullYear();
            });
            const dateKey = dayViewDate.toISOString().split('T')[0];
            const postsForDay = { [dateKey]: dayPosts };
            return <MobileScheduleView postsByDate={postsForDay} onPostClick={openPreviewModal} onNewPostClick={enterCreateMode} showDateHeaders={false} />;
        }
        if (viewMode === 'calendar') {
            if (viewType === 'month') {
                return <MonthView currentDate={currentDate} posts={currentPosts} onDayClick={handleDayClick} onPostClick={openPreviewModal} onMoreClick={handleDayClick} onNewPostClick={enterCreateMode} isMobile={isMobile} />;
            }
            if (viewType === 'week' && !isMobile) {
                return <WeekView currentDate={currentDate} posts={currentPosts} onPostClick={openPreviewModal} onNewPostClick={enterCreateMode} />;
            }
        }
        return null;
    };

    const getHeaderText = () => {
        if (viewMode === 'day') return dayViewDate.toLocaleString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (viewMode === 'list') return "All Scheduled Posts";
        if (viewType === 'month') return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (viewType === 'week') return `${getStartOfWeek(currentDate).toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${getEndOfWeek(currentDate).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        return '';
    };

    const handleCalendarClick = () => {
        setViewMode('calendar');
        if (viewMode !== 'calendar') {
            setViewType('month');
        }
    }

    const navButtons = [
        { id: 'calendar', label: 'Calendar', icon: <CalendarIcon />, onClick: handleCalendarClick },
        { id: 'list', label: 'List', icon: <ListIcon />, onClick: () => setViewMode('list') },
        { id: 'day', label: 'Day', icon: <DayIcon />, onClick: () => handleDayClick(new Date()) },
    ];

    // UPDATED: Main render logic now switches between creation view and calendar view
    return (
        <div className={styles.container}>
            {isCreatingPost ? (
                <CreatePostView
                    scheduleDate={newPostDate}
                    onPostScheduled={handlePostScheduled}
                    onCancel={exitCreateMode}
                />
            ) : (
                <>
                    <header className={styles.header}>
                        <nav className={styles.subNav}>
                            {navButtons.map((button) => (
                                <button key={button.id} className={`${styles.navButton} ${viewMode === button.id ? styles.active : ''}`} onClick={button.onClick}>
                                    <span className={styles.navIcon}>{button.icon}</span>
                                    <span className={styles.navLabel}>{button.label}</span>
                                </button>
                            ))}
                        </nav>
                        <div className={styles.secondaryHeader}>
                            <div className={styles.dateNav}>
                                <button onClick={handlePrev}>&lt;</button>
                                <h2>{getHeaderText()}</h2>
                                <button onClick={handleNext}>&gt;</button>
                            </div>
                            {!isMobile && viewMode === 'calendar' && (
                                <div className={styles.viewTypeNav}>
                                    <button onClick={() => setViewType('month')} className={viewType === 'month' ? styles.activeViewType : ''}>Month</button>
                                    <button onClick={() => setViewType('week')} className={viewType === 'week' ? styles.activeViewType : ''}>Week</button>
                                </div>
                            )}
                        </div>
                    </header>
                    
                    <div className={styles.calendarContainer}>
                        {renderActiveView()}
                    </div>
                </>
            )}

            {selectedPost && <PreviewModal post={selectedPost} onClose={closePreviewModal} onDataRefresh={onDataRefresh} />}
            {/* The CreatePostModal component is no longer rendered here */}
        </div>
    );
}
