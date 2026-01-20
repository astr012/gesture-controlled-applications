/**
 * Volume control project display component
 */

import React from 'react';
import { VolumeControlData } from '../../types/gesture';
import styles from './VolumeControlDisplay.module.css';

interface Props {
  data: VolumeControlData;
}

export const VolumeControlDisplay: React.FC<Props> = ({ data }) => {
  const volumePercentage = Math.round(data.volume_level * 100);

  return (
    <div className={styles.container}>
      <div className={styles.volumeDisplay}>
        <div className={styles.volumeIcon}>
          {volumePercentage === 0
            ? '🔇'
            : volumePercentage < 30
              ? '🔈'
              : volumePercentage < 70
                ? '🔉'
                : '🔊'}
        </div>
        <div className={styles.volumeLevel}>
          <div className={styles.volumeNumber}>{volumePercentage}%</div>
          <div className={styles.volumeBar}>
            <div
              className={styles.volumeFill}
              style={{ width: `${volumePercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className={styles.gestureInfo}>
        <div className={styles.infoCard}>
          <span className={styles.infoLabel}>Gesture Distance:</span>
          <span className={styles.infoValue}>
            {data.gesture_distance.toFixed(2)}
          </span>
        </div>

        <div className={styles.infoCard}>
          <span className={styles.infoLabel}>Status:</span>
          <span
            className={`${styles.infoValue} ${
              data.is_controlling ? styles.active : styles.inactive
            }`}
          >
            {data.is_controlling ? 'Controlling' : 'Idle'}
          </span>
        </div>
      </div>

      <div className={styles.instructions}>
        <h4>How to use:</h4>
        <ul>
          <li>Show your thumb and index finger to the camera</li>
          <li>Pinch fingers together to decrease volume</li>
          <li>Spread fingers apart to increase volume</li>
        </ul>
      </div>
    </div>
  );
};
