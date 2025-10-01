/*
 * ==========================================================
 * COMPONENT: SchedulePage
 * PAGE: Schedule Page
 * FILE: /components/SchedulePage/SchedulePage.js
 * ==========================================================
 */
'use client';
import { useState, useMemo } from 'react';
import styles from './SchedulePage.module.css';
import CreatePostView from './CreatePostView/CreatePostView';
import PostPreviewAndEditView from './PostPreviewAndEditView/PostPreviewAndEditView';
import MobileScheduleView from './MobileScheduleView/MobileScheduleView';
import { useWindowSize } from '@/hooks/useWindowSize';
import { CalendarIcon, DayIcon, ListIcon } from './SchedulePageIcons';
import MonthView from './MonthView/MonthView';
import WeekView from './WeekView/WeekView';
import { useAppContext } from '@/app/context/AppContext';
import AddChoicePopover from './AddChoicePopover/AddChoicePopover';
import ManageMatchView from './ManageMatchView/ManageMatchView'; // MODIFIED: Import the new view

export default function SchedulePage() {
    const { appData, refreshAppData } = useAppContext();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedPost, setSelectedPost] = useState(null);
    const [newPostDate, setNewPostDate] = useState(null);
    const [viewMode, setViewMode] = useState('calendar');
    const [viewType, setViewType] = useState('month');
    const [dayViewDate, setDayViewDate] = useState(new Date());
    const [pageView, setPageView] = useState('calendar');

    const [scheduleFilter, setScheduleFilter] = useState('all');
    const [showAddChoice, setShowAddChoice] = useState(false);
    const [addEventDate, setAddEventDate] = useState(null);

    const [matchToManage, setMatchToManage] = useState(null); // MODIFIED: State for add/edit match form

    const { width } = useWindowSize();
    const isMobile = width && width <= 768;

    const handleSelectPost = (post) => {
        setSelectedPost(post);
        setPageView('preview');
    };

    // MODIFIED: This now opens the form view within this page
    const handleSelectMatch = (match) => {
        setMatchToManage(match);
        setPageView('manageMatch');
    };

    const handleExitPreview = () => {
        setSelectedPost(null);
        setPageView('calendar');
    };

    const handleNewEventClick = (date) => {
        setAddEventDate(date);
        setShowAddChoice(true);
    };

    // MODIFIED: Handles the choice from the popover
    const handleAddChoice = (choice) => {
        setShowAddChoice(false);
        if (choice === 'post') {
            setNewPostDate(addEventDate);
            setPageView('create');
        } else if (choice === 'match') {
            const dateString = addEventDate.toISOString().split('T')[0];
            setMatchToManage({ matchDate: dateString }); // Set initial data for a new match
            setPageView('manageMatch');
        }
    };

    const exitCreateMode = () => {
        setPageView('calendar');
        setNewPostDate(null);
    };

    // MODIFIED: Generic handler for when match form is done
    const exitMatchMode = () => {
        setPageView('calendar');
        setMatchToManage(null);
        refreshAppData(); // Refresh data after adding/editing a match
    };

    const handlePostScheduled = () => {
        refreshAppData();
        exitCreateMode();
    };

    const handlePostUpdated = () => {
        refreshAppData();
        handleExitPreview();
    };

    const handleDayClick = (date) => {
        setDayViewDate(date);
        setViewMode('day');
    };

    // ... (utility functions like getStartOfWeek, getEndOfWeek remain unchanged)
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
    
    const scheduledEvents = useMemo(() => {
        const posts = (appData?.scheduledPosts || []).map(p => ({ ...p, type: 'post' }));
        const matches = (appData?.matches || []).map(m => ({ ...m, type: 'match' }));
        if (scheduleFilter === 'posts') return posts;
        if (scheduleFilter === 'matches') return matches;
        return [...posts, ...matches];
    }, [appData, scheduleFilter]);

    const currentEvents = useMemo(() => {
        return scheduledEvents.filter(event => {
            const eventDate = new Date(event.type === 'post' ? event.scheduled_time_utc : `${event.matchDate}T${event.matchTime || '00:00'}`);
            if (viewType === 'month') {
                return eventDate.getFullYear() === currentDate.getFullYear() && eventDate.getMonth() === currentDate.getMonth();
            } else if (viewType === 'week') {
                const start = getStartOfWeek(currentDate);
                const end = getEndOfWeek(currentDate);
                return eventDate >= start && eventDate <= end;
            }
            return false;
        });
    }, [scheduledEvents, currentDate, viewType]);

    // ... (handlePrev, handleNext, renderActiveView, getHeaderText, etc. remain unchanged)
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
            return <MobileScheduleView events={scheduledEvents} onPostClick={handleSelectPost} onMatchClick={handleSelectMatch} onNewEventClick={handleNewEventClick} showDateHeaders={true} currentDate={new Date()} />;
        }
        if (viewMode === 'day') {
            const dayEvents = scheduledEvents.filter(event => {
                const eventDate = new Date(event.type === 'post' ? event.scheduled_time_utc : `${event.matchDate}T${event.matchTime || '00:00'}`);
                return eventDate.toDateString() === dayViewDate.toDateString();
            });
            return <MobileScheduleView events={dayEvents} onPostClick={handleSelectPost} onMatchClick={handleSelectMatch} onNewEventClick={handleNewEventClick} showDateHeaders={false} currentDate={dayViewDate} />;
        }
        if (viewMode === 'calendar') {
            if (viewType === 'month') {
                return <MonthView currentDate={currentDate} events={currentEvents} onDayClick={handleDayClick} onPostClick={handleSelectPost} onMatchClick={handleSelectMatch} onMoreClick={handleDayClick} onNewEventClick={handleNewEventClick} isMobile={isMobile} />;
            }
            if (viewType === 'week' && !isMobile) {
                return <WeekView currentDate={currentDate} events={currentEvents} onPostClick={handleSelectPost} onMatchClick={handleSelectMatch} onNewEventClick={handleNewEventClick} />;
            }
        }
        return null;
    };

    const getHeaderText = () => {
        if (viewMode === 'day') return dayViewDate.toLocaleString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (viewMode === 'list') return "All Scheduled Events";
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
    
    // MODIFIED: Render logic to include the new match management view
    if (pageView === 'create') return <CreatePostView scheduleDate={newPostDate} onPostScheduled={handlePostScheduled} onCancel={exitCreateMode} />;
    if (pageView === 'preview' && selectedPost) return <PostPreviewAndEditView post={selectedPost} onClose={handleExitPreview} onPostUpdated={handlePostUpdated} />;
    if (pageView === 'manageMatch') return <ManageMatchView initialData={matchToManage} onComplete={exitMatchMode} onCancel={exitMatchMode} />;

    return (
        <div className={styles.container}>
            {showAddChoice && <AddChoicePopover onChoice={handleAddChoice} onDismiss={() => setShowAddChoice(false)} />}
            {pageView === 'calendar' && (
                <>
                    <header className={styles.header}>
                        <div className={styles.topHeader}>
                            <nav className={styles.subNav}>
                                {navButtons.map((button) => (
                                    <button key={button.id} className={`${styles.navButton} ${viewMode === button.id ? styles.active : ''}`} onClick={button.onClick}>
                                        <span className={styles.navIcon}>{button.icon}</span>
                                        <span className={styles.navLabel}>{button.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                        
                        <div className={styles.secondaryHeader}>
                            <div className={styles.dateNav}>
                                <button onClick={handlePrev}>&lt;</button>
                                <h2>{getHeaderText()}</h2>
                                <button onClick={handleNext}>&gt;</button>
                            </div>
                            
                            <div className={styles.controlsWrapper}>
                                <div className={styles.filterNav}>
                                    <button onClick={() => setScheduleFilter('posts')} className={scheduleFilter === 'posts' ? styles.activeFilter : ''}>Posts</button>
                                    <button onClick={() => setScheduleFilter('all')} className={scheduleFilter === 'all' ? styles.activeFilter : ''}>All</button>
                                    <button onClick={() => setScheduleFilter('matches')} className={scheduleFilter === 'matches' ? styles.activeFilter : ''}>Matches</button>
                                </div>
                                {!isMobile && viewMode === 'calendar' && (
                                    <div className={styles.viewTypeNav}>
                                        <button onClick={() => setViewType('month')} className={viewType === 'month' ? styles.activeViewType : ''}>Month</button>
                                        <button onClick={() => setViewType('week')} className={viewType === 'week' ? styles.activeViewType : ''}>Week</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>
                    <div className={styles.calendarContainer}>
                        {renderActiveView()}
                    </div>
                </>
            )}
        </div>
    );
}
