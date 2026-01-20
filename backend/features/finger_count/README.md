# Finger Count Feature

A complete gesture control feature for counting fingers and recognizing hand poses.

## Overview

This feature provides:

- Real-time finger counting (0-10 fingers across two hands)
- Pose detection (fist, peace sign, thumbs up, pointing, open palm)
- Per-finger state tracking
- Temporal smoothing for stable detection

## Files

| File            | Purpose                                     |
| --------------- | ------------------------------------------- |
| `__init__.py`   | Feature registration and exports            |
| `classifier.py` | Finger counting and pose detection logic    |
| `actions.py`    | System actions triggered by finger gestures |
| `config.py`     | Feature-specific configuration              |

## How It Works

1. **Landmarks Received**: 21 landmarks per hand from MediaPipe
2. **Finger Analysis**: Compare tip positions to joint positions
3. **Pose Classification**: Pattern matching on finger states
4. **Temporal Smoothing**: Average over N frames for stability

## Supported Gestures

| Gesture      | Detection Logic                       |
| ------------ | ------------------------------------- |
| Finger Count | Compare tip.y < pip.y for each finger |
| Fist         | All fingers down                      |
| Open Palm    | All 5 fingers up                      |
| Peace        | Only index + middle up                |
| Thumbs Up    | Only thumb extended                   |
| Pointing     | Only index finger up                  |

## Configuration

```python
from features.finger_count.config import FingerCountConfig

config = FingerCountConfig(
    smoothing_frames=3,      # Temporal averaging window
    thumb_detection=True,    # Include thumb in count
    enable_poses=True,       # Detect hand poses
    min_confidence=0.7       # Minimum detection confidence
)
```

## Usage

```python
from features.finger_count import FingerCountFeature

# Get the classifier
classifier = FingerCountFeature.get_classifier()

# Process extraction result
result = classifier.classify(extraction_result)

print(f"Finger count: {result.finger_count}")
print(f"Pose: {result.gesture_type}")
```

## Testing

```bash
cd backend
pytest tests/features/test_finger_count.py -v
```
