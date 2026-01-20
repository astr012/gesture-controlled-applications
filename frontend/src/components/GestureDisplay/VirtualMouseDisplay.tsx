/**
 * Virtual mouse project display component
 */

import React from 'react';
import { VirtualMouseData } from '../../types/gesture';
import styles from './VirtualMouseDisplay.module.css';

interface Props {
  data: VirtualMouseData;
}

export const VirtualMouseDisplay: React.FC<Props> = ({ data }) => {
  return (
    <div className={styles.container}>
      <div className={styles.cursorDisplay}>
        <div className={styles.cursorInfo}>
          <h3>Cursor Position</h3>
          <div className={styles.coordinates}>
            <span>X: {Math.round(data.cursor_x)}</span>
            <span>Y: {Math.round(data.cursor_y)}</span>
          </div>
        </div>

        <div className={styles.cursorVisual}>
          <div
            className={styles.cursor}
            style={{
              left: `${(data.cursor_x / 1920) * 100}%`,
              top: `${(data.cursor_y / 1080) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className={styles.gestureInfo}>
        <div className={styles.infoCard}>
          <span className={styles.infoLabel}>Mode:</span>
          <span className={`${styles.infoValue} ${styles[data.gesture_mode]}`}>
            {data.gesture_mode.charAt(0).toUpperCase() +
              data.gesture_mode.slice(1)}
          </span>
        </div>

        <div className={styles.infoCard}>
          <span className={styles.infoLabel}>Clicking:</span>
          <span
            className={`${styles.infoValue} ${
              data.is_clicking ? styles.active : styles.inactive
            }`}
          >
            {data.is_clicking ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <div className={styles.instructions}>
        <h4>How to use:</h4>
        <ul>
          <li>Point with your index finger to move cursor</li>
          <li>Make a fist to click</li>
          <li>Use two fingers for scroll mode</li>
        </ul>
      </div>
    </div>
  );
};
