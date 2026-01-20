# Volume Control Feature

A gesture-based volume control feature using pinch gestures.

## Overview

This feature provides:

- Pinch-to-control volume adjustment
- Mute toggle with fist gesture
- Visual volume feedback
- Smooth volume interpolation

## Files

| File            | Purpose                               |
| --------------- | ------------------------------------- |
| `__init__.py`   | Feature registration and exports      |
| `classifier.py` | Pinch detection and volume mapping    |
| `actions.py`    | System volume control (Windows/macOS) |
| `config.py`     | Feature-specific configuration        |

## How It Works

1. **Pinch Detection**: Track distance between thumb tip and index tip
2. **Volume Mapping**: Map pinch distance to volume level (0-100%)
3. **Smoothing**: Apply interpolation for smooth transitions
4. **System Integration**: Use pycaw (Windows) to control audio

## Gestures

| Gesture              | Action          |
| -------------------- | --------------- |
| Pinch (open → close) | Decrease volume |
| Pinch (close → open) | Increase volume |
| Fist hold (1s)       | Toggle mute     |

## Configuration

```python
from features.volume_control.config import VolumeControlConfig

config = VolumeControlConfig(
    volume_step=0.05,        # Step size per frame
    pinch_threshold=0.05,    # Min distance for pinch
    mute_hold_duration=1000, # ms to hold for mute
    smoothing_factor=0.3     # Volume interpolation
)
```

## Usage

```python
from features.volume_control import VolumeControlFeature

# Get the classifier and actions
classifier = VolumeControlFeature.get_classifier()
actions = VolumeControlFeature.get_actions()

# Process and apply
result = classifier.classify(extraction_result)
await actions.execute(result)
```

## Requirements

- **Windows**: pycaw (automatically installed)
- **macOS**: osascript (built-in)
- **Linux**: amixer or pactl (system dependent)
