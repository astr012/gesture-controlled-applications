/**
 * Main gesture data visualization component
 */

import React from 'react';
import {
  GestureData,
  FingerCountData,
  VolumeControlData,
  VirtualMouseData,
} from '../../types/gesture';
import { FingerCountDisplay } from './FingerCountDisplay';
import { VolumeControlDisplay } from './VolumeControlDisplay';
import { VirtualMouseDisplay } from './VirtualMouseDisplay';
import styles from './GestureDisplay.module.css';

interface Props {
  gestureData: GestureData | null;
}

export const GestureDisplay: React.FC<Props> = ({ gestureData }) => {
  if (!gestureData) {
    return (
      <div className={styles.container}>
        <div className={styles.noData}>
          <div className={styles.noDataIcon}>👋</div>
          <h3>No gesture data</h3>
          <p>Select a project and ensure your camera is working</p>
        </div>
      </div>
    );
  }

  const renderProjectDisplay = () => {
    switch (gestureData.project) {
      case 'finger_count':
        return <FingerCountDisplay data={gestureData as FingerCountData} />;
      case 'volume_control':
        return <VolumeControlDisplay data={gestureData as VolumeControlData} />;
      case 'virtual_mouse':
        return <VirtualMouseDisplay data={gestureData as VirtualMouseData} />;
      default:
        return (
          <div className={styles.unknownProject}>
            <p>Unknown project: {gestureData.project}</p>
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Gesture Detection</h2>
        <div className={styles.metadata}>
          <span className={styles.handsCount}>
            Hands detected: {gestureData.hands_detected}
          </span>
          <span className={styles.timestamp}>
            Last update:{' '}
            {new Date(gestureData.timestamp * 1000).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className={styles.content}>{renderProjectDisplay()}</div>
    </div>
  );
};
