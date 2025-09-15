/*
 * ==========================================================
 * COMPONENT: SchedulePage
 * PAGE: /schedule
 * FILE: /components/SchedulePage/SchedulePage.js
 ==========================================================
 */
'use client';
import { useState } from 'react';
import styles from './SchedulePage.module.css';
import PreviewModal from '../PreviewModal/PreviewModal';
import PostPreview from '../PostPreview/PostPreview';
import MobileScheduleView from '../MobileScheduleView/MobileScheduleView';
import { useWindowSize } from '@/hooks/useWindowSize';
import { CalendarIcon, ListIcon, MoreIcon, MonthIcon, WeekIcon } from './SchedulePageIcons';

export default function SchedulePage({ appData }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // calendar, list
  const [viewType, setViewType] = useState('month'); // month, week
  const [scrollToDate, setScrollToDate] = useState(null);
  const { width } = useWindowSize();

  const openModal = (post) => {
    setSelectedPost(post);
  };

  const closeModal = () => {
    setSelectedPost(null);
  };

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const getStartOfWeek = (date) => {
    const day = date.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const diff = date.getDate() - (day === 0 ? 6 : day - 1); // Adjust to start week on Monday
    return new Date(date.getFullYear(), date.getMonth(), diff);
  };

  const getEndOfWeek = (date) => {
    const startOfWeek = getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // Set to end of the day
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

  const renderDays = () => {
    const days = [];
    let displayDays = [];

    if (viewType === 'month') {
      const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;
      for (let i = 0; i < adjustedStartDay; i++) {
        days.push(<div key={`empty-${i}`} className={styles.day}></div>);
      }
      for (let i = 1; i <= daysInMonth; i++) {
        displayDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
      }
    } else if (viewType === 'week') {
      const start = getStartOfWeek(currentDate);
      for (let i = 0; i < 7; i++) {
        displayDays.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
      }
    }

    displayDays.forEach(date => {
      const dayPosts = currentPosts.filter(post => {
        const postDate = new Date(post.scheduled_time_utc);
        return postDate.getDate() === date.getDate() &&
               postDate.getMonth() === date.getMonth() &&
               postDate.getFullYear() === date.getFullYear();
      });
      days.push(
        <div key={date.toISOString()} className={styles.day}>
          <span>{date.getDate()}</span>
          <div className={styles.posts}>
            {/* MODIFIED: Conditional rendering based on viewType */}
            {viewType === 'month' ? (
              <>
                {dayPosts.slice(0, 2).map(post => (
                  <PostPreview key={post.id} post={post} onClick={openModal} />
                ))}
                {dayPosts.length > 2 && (
                  <button
                    className={styles.moreButton}
                    onClick={() => {
                      setScrollToDate(date);
                      setViewMode('list');
                    }}
                  >
                    <MoreIcon /><span>{dayPosts.length - 2} more</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {/* For week view, show all posts with no limit */}
                {dayPosts.map(post => (
                  <PostPreview key={post.id} post={post} onClick={openModal} />
                ))}
              </>
            )}
          </div>
        </div>
      );
    });
    return days;
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
          <button onClick={() => setViewType('month')} className={viewType === 'month' ? styles.activeView : ''}><MonthIcon /><span>Month</span></button>
          <button onClick={() => setViewType('week')} className={viewType === 'week' ? styles.activeView : ''}><WeekIcon /><span>Week</span></button>
          <button onClick={() => setViewMode('calendar')} className={viewMode === 'calendar' ? styles.activeView : ''}><CalendarIcon /></button>
          <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? styles.activeView : ''}><ListIcon /></button>
        </div>
      </div>
      {(viewMode === 'list' || (width && width <= 768)) ? (
        <MobileScheduleView posts={currentPosts} onPostClick={openModal} scrollToDate={scrollToDate} />
      ) : (
        <div className={`${styles.calendarGrid} ${viewType === 'month' ? styles.monthView : styles.weekView}`}>
          <div className={styles.dayName}>Mon</div>
          <div className={styles.dayName}>Tue</div>
          <div className={styles.dayName}>Wed</div>
          <div className={styles.dayName}>Thu</div>
          <div className={styles.dayName}>Fri</div>
          <div className={styles.dayName}>Sat</div>
          <div className={styles.dayName}>Sun</div>
          {renderDays()}
        </div>
      )}
      {selectedPost && <PreviewModal post={selectedPost} onClose={closeModal} />}
    </div>
  );
}
