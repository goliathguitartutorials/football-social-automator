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
import { CalendarIcon, DayIcon, ListIcon, MonthIcon, WeekIcon } from './SchedulePageIcons';
import MonthView from './MonthView/MonthView';
import WeekView from './WeekView/WeekView';

export default function SchedulePage({ appData }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // calendar, list, day
  const [viewType, setViewType] = useState('month'); // month, week
  const [dayViewDate, setDayViewDate] = useState(new Date());
  const { width } = useWindowSize();

  const openModal = (post) => {
    setSelectedPost(post);
  };

  const closeModal = () => {
    setSelectedPost(null);
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
    const isMobile = width && width <= 768;

    if (viewMode === 'list') {
      return (
        <MobileScheduleView
          posts={scheduledPosts}
          onPostClick={openModal}
        />
      );
    }

    if (viewMode === 'day') {
      const dayPosts = scheduledPosts.filter(post => {
        const postDate = new Date(post.scheduled_time_utc);
        return postDate.getDate() === dayViewDate.getDate() &&
               postDate.getMonth() === dayViewDate.getMonth() &&
               postDate.getFullYear() === dayViewDate.getFullYear();
      });
      return (
        <MobileScheduleView
          posts={dayPosts}
          onPostClick={openModal}
        />
      );
    }
    
    if (viewMode === 'calendar') {
      if (isMobile) {
        return <MonthView
          currentDate={currentDate}
          posts={currentPosts}
          onDayClick={handleDayClick} // Use new handler for mobile
          isMobile={true}
        />;
      }

      if (viewType === 'month') {
        return <MonthView
          currentDate={currentDate}
          posts={currentPosts}
          onPostClick={openModal} // Keep old handler for desktop
          onMoreClick={(date) => handleDayClick(date)}
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

  const getHeaderText = () => {
    if (viewMode === 'day') {
      return dayViewDate.toLocaleString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (viewType === 'month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (viewType === 'week') {
      return `${getStartOfWeek(currentDate).toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${getEndOfWeek(currentDate).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return '';
  }

  return (
    <div className={styles.schedulePage}>
      <div className={styles.calendarHeader}>
        <div>
          <button onClick={handlePrev}>&lt;</button>
          <h2>{getHeaderText()}</h2>
          <button onClick={handleNext}>&gt;</button>
        </div>
        <div>
          <button onClick={() => { setViewMode('calendar'); setViewType('month'); }} className={`${viewType === 'month' && viewMode === 'calendar' ? styles.activeView : ''} ${styles.desktopOnlyButton}`}><MonthIcon /><span>Month</span></button>
          <button onClick={() => { setViewMode('calendar'); setViewType('week'); }} className={`${viewType === 'week' && viewMode === 'calendar' ? styles.activeView : ''} ${styles.desktopOnlyButton}`}><WeekIcon /><span>Week</span></button>
          <button onClick={() => { setViewMode('day'); setDayViewDate(currentDate); }} className={`${viewMode === 'day' ? styles.activeView : ''}`}><DayIcon /><span>Day</span></button>
          <button onClick={() => setViewMode('calendar')} className={`${viewMode === 'calendar' ? styles.activeView : ''}`}><CalendarIcon /><span>Calendar</span></button>
          <button onClick={() => setViewMode('list')} className={`${viewMode === 'list' ? styles.activeView : ''}`}><ListIcon /><span>List</span></button>
        </div>
      </div>
      
      <div className={styles.calendarContainer}>
        {renderActiveView()}
      </div>

      {selectedPost && <PreviewModal post={selectedPost} onClose={closeModal} />}
    </div>
  );
}
