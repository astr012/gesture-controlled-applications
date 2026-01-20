# Virtual Mouse Feature

A precision virtual mouse controlled by hand gestures.

## Overview

This feature provides:

- High-precision cursor tracking using index finger
- Click gestures (pinch for left click)
- Drag and drop support
- One Euro Filter smoothing for jitter reduction

## Files

| File            | Purpose                          |
| --------------- | -------------------------------- |
| `__init__.py`   | Feature registration and exports |
| `classifier.py` | Hand position to cursor mapping  |
| `actions.py`    | Cursor control using pyautogui   |
| `config.py`     | Feature-specific configuration   |
| `filters.py`    | One Euro Filter implementation   |

## How It Works

1. **Position Tracking**: Map index finger tip to screen coordinates
2. **Smoothing**: Apply One Euro Filter for smooth movement
3. **Click Detection**: Pinch thumb-to-index for left click
4. **Drag Mode**: Hold pinch while moving

## Gestures

| Gesture           | Action                 |
| ----------------- | ---------------------- |
| Index pointing    | Move cursor            |
| Pinch             | Left click             |
| Pinch + move      | Drag                   |
| Hold pinch        | Click and hold         |
| Two fingers pinch | Right click (optional) |

## Configuration

```python
from features.virtual_mouse.config import VirtualMouseConfig

config = VirtualMouseConfig(
    smoothing_enabled=True,
    smoothing_beta=0.01,
    click_threshold=0.03,
    double_click_interval=400,
    screen_margin=50
)
```

## Calibration

For best results, calibrate the gesture zone:

1. Point to top-left corner of desired area
2. Point to bottom-right corner
3. The system will map hand positions to screen area

## Requirements

- pyautogui (cross-platform cursor control)
- pynput (optional, for smoother control on some systems)
