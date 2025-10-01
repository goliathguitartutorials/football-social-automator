/*
 * ==========================================================
 * COMPONENT: MatchEventsPanel
 * PAGE: Live
 * FILE: /components/LivePage/MatchEventsPanel/MatchEventsPanel.js
 * ==========================================================
 */
import styles from './MatchEventsPanel.module.css';
import { GoalIcon, YellowCardIcon, RedCardIcon, SubIcon } from '../LivePageIcons'; // MODIFIED: Corrected import path

const EventIcon = ({ type }) => {
    if (type === 'Goal') return <GoalIcon />;
    if (type === 'Yellow Card') return <YellowCardIcon />;
    if (type === 'Red Card') return <RedCardIcon />;
    if (type === 'Substitution') return <SubIcon />;
    return null;
};

export default function MatchEventsPanel({ events, match }) {
    // ... rest of the file is unchanged
    if (!events || events.length === 0) {
        return <p className={styles.noEvents}>No events logged yet.</p>;
    }

    const renderEventDetails = (event) => {
        switch (event.eventType) {
            case 'Goal':
                return `${event.playerFullName}${event.assistByFullName ? ` (assist by ${event.assistByFullName})` : ''}`;
            case 'Yellow Card':
            case 'Red Card':
                return event.playerFullName;
            case 'Substitution':
                return `${event.assistByFullName} for ${event.playerFullName}`;
            default:
                return event.eventType.replace(/_/g, ' ');
        }
    };

    const homeEvents = events.filter(e => e.team === 'home' || !e.team);
    const awayEvents = events.filter(e => e.team === 'away');

    return (
        <div className={styles.panelContainer}>
            <div className={styles.teamColumn}>
                <h4 className={styles.teamHeader}>{match.homeTeamName}</h4>
                <ul className={styles.eventList}>
                    {homeEvents.map(event => (
                        <li key={event.eventId} className={styles.eventItem}>
                            <span className={styles.eventIcon}><EventIcon type={event.eventType} /></span>
                            <span className={styles.eventMinute}>{event.minute}'</span>
                            <span className={styles.eventDetails}>{renderEventDetails(event)}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className={styles.teamColumn}>
                <h4 className={styles.teamHeader}>{match.awayTeamName}</h4>
                 <ul className={styles.eventList}>
                    {awayEvents.map(event => (
                        <li key={event.eventId} className={styles.eventItem}>
                            <span className={styles.eventIcon}><EventIcon type={event.eventType} /></span>
                            <span className={styles.eventMinute}>{event.minute}'</span>
                            <span className={styles.eventDetails}>{renderEventDetails(event)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
