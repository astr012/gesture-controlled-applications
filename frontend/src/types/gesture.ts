/**
 * Enhanced TypeScript type definitions for gesture detection data
 */

import type { ProjectType } from './project-types';

// Base gesture data with enhanced metadata
export interface GestureData {
  project: ProjectType;
  timestamp: number;
  hands_detected: number;
  confidence: number;
  processing_time: number;
  frame_id: string;
  // Project-specific data (only one will be present based on project type)
  finger_count?: FingerCountData;
  volume_control?: VolumeControlData;
  virtual_mouse?: VirtualMouseData;
}

// Enhanced finger count data
export interface FingerCountData extends GestureData {
  project: 'finger_count';
  fingers: number;
  total_fingers: number;
  hands: EnhancedHandData[];
  gesture_stability: number;
}

export interface EnhancedHandData {
  label: 'Left' | 'Right';
  confidence: number;
  fingers: number;
  finger_states: FingerStates;
  landmarks: HandLandmarks;
  bounding_box: BoundingBox;
}

export interface FingerStates {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

export interface HandLandmarks {
  wrist: Point2D;
  thumb: Point2D[];
  index: Point2D[];
  middle: Point2D[];
  ring: Point2D[];
  pinky: Point2D[];
}

export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Enhanced volume control data
export interface VolumeControlData extends GestureData {
  project: 'volume_control';
  volume_level: number;
  gesture_distance: number;
  is_controlling: boolean;
  gesture_direction: 'up' | 'down' | 'stable';
  smoothed_volume: number;
}

// Enhanced virtual mouse data
export interface VirtualMouseData extends GestureData {
  project: 'virtual_mouse';
  cursor_x: number;
  cursor_y: number;
  is_clicking: boolean;
  gesture_mode: 'move' | 'click' | 'scroll' | 'drag';
  click_confidence: number;
  smoothed_position: Point2D;
}

// Legacy types for backward compatibility
export type HandData = EnhancedHandData;

// Re-export types from other modules for convenience
