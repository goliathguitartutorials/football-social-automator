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
import MobileScheduleView from './MobileScheduleView/MobileScheduleView';
import { useWindowSize } from '@/hooks/useWindowSize';
import { CalendarIcon, ListIcon, MonthIcon, WeekIcon } from './SchedulePageIcons';
import MonthView from './MonthView/MonthView';
import WeekView from './WeekView/WeekView';

export default function SchedulePage({ appData }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // calendar, list
  const [viewType, setViewType] = useState('month'); // month, week
  const [listScrollTargetDate, setListScrollTargetDate] = useState(null);
  const { width } = useWindowSize();

  const openModal = (post) => {
    setSelectedPost(post);
  };

  const closeModal = () => {
    setSelectedPost(null);
  };

  const handleMoreClick = (date) => {
    setListScrollTargetDate(date);
    setViewMode('list');
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
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewType === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    }
  };

  const handleNext = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewType === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    }
  };

  const renderCalendarView = () => {
    const isMobile = width && width <= 768;

    // List view is the same for both mobile and desktop toggle
    if (viewMode === 'list') {
      return (
        <MobileScheduleView
          posts={scheduledPosts}
          onPostClick={openModal}
          scrollToDate={listScrollTargetDate}
        />
      );
    }
    
    // Calendar view logic
    if (viewMode === 'calendar') {
      // On mobile, force MonthView and pass the isMobile prop
      if (isMobile) {
        return <MonthView
          currentDate={currentDate}
          posts={currentPosts}
          onPostClick={openModal}
          onMoreClick={handleMoreClick}
          isMobile={true}
        />;
      }

      // On desktop, respect the month/week toggle
      if (viewType === 'month') {
        return <MonthView
          currentDate={currentDate}
          posts={currentPosts}
          onPostClick={openModal}
          onMoreClick={handleMoreClick}
          isMobile={false}
        />;
      }

      if (viewType === 'week') {
        return <WeekView
          currentDate={currentDate}
          posts={currentPosts}
          onPostClick={openModal}
        />;
      }
    }

    return null;
  };

  return (
    <div className={styles.schedulePage}>
      <div className={styles.calendarHeader}>
        <div>
          <button onClick={handlePrev}>&lt;</button>
          <h2>
            {viewType === 'month'
              ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
              : `${getStartOfWeek(currentDate).toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${getEndOfWeek(currentDate).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
            }
          </h2>
          <button onClick={handleNext}>&gt;</button>
        </div>
        <div>
          <button onClick={() => setViewType('month')} className={`${viewType === 'month' ? styles.activeView : ''} ${styles.desktopOnlyButton}`}><MonthIcon /><span>Month</span></button>
          <button onClick={() => setViewType('week')} className={`${viewType === 'week' ? styles.activeView : ''} ${styles.desktopOnlyButton}`}><WeekIcon /><span>Week</span></button>
          <button onClick={() => setViewMode('calendar')} className={viewMode === 'calendar' ? styles.activeView : ''}><CalendarIcon /></button>
          <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? styles.activeView : ''}><ListIcon /></button>
        </div>
      </div>
      
      <div className={styles.calendarContainer}>
        {renderCalendarView()}
      </div>

      {selectedPost && <PreviewModal post={selectedPost} onClose={closeModal} />}
    </div>
  );
}
