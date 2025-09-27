/*
 * ==========================================================
 * COMPONENT: MatchEventsPanel
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/LiveTab/MatchEventsPanel/MatchEventsPanel.js
 * ==========================================================
 */
import styles from './MatchEventsPanel.module.css';
import { GoalIcon, YellowCardIcon, RedCardIcon, SubIcon } from '../LiveTabIcons';

const EventIcon = ({ type }) => {
    if (type === 'Goal') return <GoalIcon />;
    if (type === 'Yellow Card') return <YellowCardIcon />;
    if (type === 'Red Card') return <RedCardIcon />;
    if (type === 'Substitution') return <SubIcon />;
    return null;
};

export default function MatchEventsPanel({ events, match }) {
    if (events.length === 0) {
        return <p className={styles.noEvents}>No events logged yet.</p>;
    }

    const renderEventDetails = (event) => {
        switch (event.eventType) {
            case 'Goal':
                return `${event.scorer}${event.assist ? ` (assist by ${event.assist})` : ''}`;
            case 'Yellow Card':
            case 'Red Card':
                return event.player;
            case 'Substitution':
                return `${event.playerOn} for ${event.playerOff}`;
            default:
                return '';
        }
    };

    const homeEvents = events.filter(e => e.team === 'home');
    const awayEvents = events.filter(e => e.team === 'away');

    return (
        <div className={styles.panelContainer}>
            <div className={styles.teamColumn}>
                <h4 className={styles.teamHeader}>{match.homeTeamName}</h4>
                <ul className={styles.eventList}>
                    {homeEvents.map(event => (
                        <li key={event.id} className={styles.eventItem}>
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
                        <li key={event.id} className={styles.eventItem}>
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
