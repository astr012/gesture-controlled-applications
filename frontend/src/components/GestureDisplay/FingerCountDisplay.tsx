/**
 * Finger counting project display component
 */

import React from 'react';
import { FingerCountData } from '../../types/gesture';
import styles from './FingerCountDisplay.module.css';

interface Props {
  data: FingerCountData;
}

export const FingerCountDisplay: React.FC<Props> = ({ data }) => {
  const renderFingerState = (isUp: boolean) => (
    <span
      className={`${styles.finger} ${isUp ? styles.fingerUp : styles.fingerDown}`}
    >
      {isUp ? '👆' : '👇'}
    </span>
  );

  return (
    <div className={styles.container}>
      <div className={styles.totalCount}>
        <div className={styles.countNumber}>{data.total_fingers}</div>
        <div className={styles.countLabel}>Total Fingers</div>
      </div>

      {data.hands.map((hand, index) => (
        <div key={index} className={styles.handCard}>
          <div className={styles.handHeader}>
            <h3 className={styles.handLabel}>{hand.label} Hand</h3>
            <div className={styles.handStats}>
              <span className={styles.fingerCount}>{hand.fingers} fingers</span>
              <span className={styles.confidence}>
                {Math.round(hand.confidence * 100)}% confidence
              </span>
            </div>
          </div>

          <div className={styles.fingerStates}>
            <div className={styles.fingerRow}>
              <span className={styles.fingerName}>Thumb:</span>
              {renderFingerState(hand.finger_states.thumb)}
            </div>
            <div className={styles.fingerRow}>
              <span className={styles.fingerName}>Index:</span>
              {renderFingerState(hand.finger_states.index)}
            </div>
            <div className={styles.fingerRow}>
              <span className={styles.fingerName}>Middle:</span>
              {renderFingerState(hand.finger_states.middle)}
            </div>
            <div className={styles.fingerRow}>
              <span className={styles.fingerName}>Ring:</span>
              {renderFingerState(hand.finger_states.ring)}
            </div>
            <div className={styles.fingerRow}>
              <span className={styles.fingerName}>Pinky:</span>
              {renderFingerState(hand.finger_states.pinky)}
            </div>
          </div>
        </div>
      ))}

      {data.hands.length === 0 && (
        <div className={styles.noHands}>
          <p>No hands detected</p>
          <p>Show your hands to the camera</p>
        </div>
      )}
    </div>
  );
};
