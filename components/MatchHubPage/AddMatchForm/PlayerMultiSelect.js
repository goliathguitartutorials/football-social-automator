/*
 * ==========================================================
 * COMPONENT: PlayerMultiSelect
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/AddMatchForm/PlayerMultiSelect.js
 ==========================================================
 */
'use client';
import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import styles from './PlayerMultiSelect.module.css';

export default function PlayerMultiSelect({ selectedPlayers, onChange }) {
    const { appData } = useAppContext();
    const { players = [] } = appData;

    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Filter out players who are already selected
    const availablePlayers = Array.isArray(players) 
        ? players.filter(p => !selectedPlayers.includes(p.fullName)) 
        : [];

    const filteredPlayers = searchTerm
        ? availablePlayers.filter(p => p.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
        : availablePlayers;

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelectPlayer = (playerName) => {
        onChange([...selectedPlayers, playerName]);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleRemovePlayer = (playerName) => {
        onChange(selectedPlayers.filter(p => p !== playerName));
    };

    return (
        <div className={styles.multiSelectContainer} ref={wrapperRef}>
            <div className={styles.selectedPillsContainer}>
                {selectedPlayers.map(player => (
                    <div key={player} className={styles.pill}>
                        {player}
                        <button type="button" onClick={() => handleRemovePlayer(player)} className={styles.removeButton}>×</button>
                    </div>
                ))}
            </div>
            <div className={styles.autocompleteWrapper}>
                <input
                    type="text"
                    className={styles.autocompleteInput}
                    placeholder="Type to search for a player..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                />
                {isOpen && filteredPlayers.length > 0 && (
                    <ul className={styles.autocompleteList}>
                        {filteredPlayers.map(player => (
                            <li key={player.row_number} onClick={() => handleSelectPlayer(player.fullName)}>
                                {player.fullName}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
