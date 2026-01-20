# Project Specifications

> **Document**: 06-PROJECT-SPECIFICATIONS.md  
> **Version**: 2.0.0  
> **Scope**: Intermediate-level project definitions with pipeline and dashboard mappings

---

## Overview

This document defines **portfolio-grade, intermediate-difficulty projects** that demonstrate real engineering depth, real-time constraints, and modular extensibility. Each project is scoped to provide meaningful learning outcomes while remaining achievable.

---

## Project Portfolio

| #   | Project                        | Difficulty   | Category    | Status   |
| --- | ------------------------------ | ------------ | ----------- | -------- |
| 1   | **Smart Finger Counter**       | Intermediate | Basic       | Redesign |
| 2   | **Gesture Volume Controller**  | Intermediate | Control     | New      |
| 3   | **Precision Virtual Mouse**    | Advanced     | Control     | New      |
| 4   | **Sign Language Alphabet**     | Advanced     | Recognition | New      |
| 5   | **Gesture-Based Presentation** | Intermediate | Application | New      |

---

## Project 1: Smart Finger Counter

### Overview

**Enhanced finger counting with pose classification and gesture recognition.**

Unlike simple finger counting, this project demonstrates:

- Pose-based gesture recognition (beyond counting)
- Statistical confidence tracking
- Gesture vocabulary (peace sign, thumbs up, fist)
- Multi-hand coordination detection

### Technical Scope

```
Difficulty: Intermediate
Engineering Depth:
  - Custom pose classification on top of landmarks
  - Temporal smoothing for stable detection
  - Gesture state machine with hysteresis
  - Real-time performance optimization

Real-Time Constraints:
  - 30 FPS minimum processing
  - < 50ms end-to-end latency
  - Smooth pose transitions
```

### Pipeline Architecture

```
┌─────────────┐    ┌─────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│  INGESTION  │───▶│ PREPROCESS  │───▶│     EXTRACTION       │───▶│      INFERENCE      │
│             │    │             │    │                      │    │                     │
│ 30 FPS      │    │ RGB Convert │    │ MediaPipe Hands      │    │ Finger Counter      │
│ 640x480     │    │ Normalize   │    │ 21 Landmarks/hand    │    │ Pose Classifier     │
│             │    │             │    │ Confidence scores    │    │ State Machine       │
└─────────────┘    └─────────────┘    └──────────────────────┘    └─────────────────────┘
                                                                            │
                                                                            ▼
                                                                  ┌─────────────────────┐
                                                                  │       OUTPUT        │
                                                                  │                     │
                                                                  │ WebSocket Event     │
                                                                  │ Gesture: 5 fingers  │
                                                                  │ Pose: peace_sign    │
                                                                  └─────────────────────┘
```

### Inference Specification

**Finger Counting Logic:**

```python
@dataclass
class FingerCountResult:
    total_fingers: int             # 0-10 (both hands)
    hands: List[HandResult]
    detected_pose: PoseType        # PEACE, THUMBS_UP, FIST, OPEN_PALM, etc.
    pose_confidence: float
    is_stable: bool                # Temporally consistent

class PoseType(Enum):
    UNKNOWN = "unknown"
    FIST = "fist"
    OPEN_PALM = "open_palm"
    PEACE = "peace"
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"
    POINTING = "pointing"
    OK_SIGN = "ok_sign"
```

**Pose Classification Rules:**
| Pose | Thumb | Index | Middle | Ring | Pinky |
|------|-------|-------|--------|------|-------|
| Fist | Down | Down | Down | Down | Down |
| Open Palm | Up | Up | Up | Up | Up |
| Peace | Down | Up | Up | Down | Down |
| Thumbs Up | Up | Down | Down | Down | Down |
| Pointing | Down | Up | Down | Down | Down |
| OK Sign | Touching Index | Curled | Up | Up | Up |

### Dashboard Design

```
┌────────────────────────────────────────────────────────────────────────────┐
│ SMART FINGER COUNTER                                        [Stop] [Gear] │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │                             │  │  FINGER COUNT                       │ │
│  │     [Hand Visualization]    │  │                                     │ │
│  │                             │  │         ████  5  ████               │ │
│  │     Landmarks rendered      │  │                                     │ │
│  │     with connections        │  │  Left: 2    Right: 3                │ │
│  │                             │  │                                     │ │
│  │                             │  ├─────────────────────────────────────┤ │
│  │     640 x 480               │  │  DETECTED POSE                      │ │
│  │                             │  │                                     │ │
│  └─────────────────────────────┘  │  ✌️ PEACE SIGN                      │ │
│                                   │  Confidence: 94%                    │ │
│                                   │                                     │ │
│  ┌─────────────────────────────┐  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │ │
│  │ SESSION STATS               │  │  │ 👊 │ │ 🖐 │ │ ✌️ │ │ 👍 │       │ │
│  │ FPS: 30.2                   │  │  └────┘ └────┘ └────┘ └────┘       │ │
│  │ Latency: 28ms               │  │    fist   palm  peace  up          │ │
│  │ Poses detected: 47          │  └─────────────────────────────────────┘ │
│  │ Accuracy: 96%               │                                         │
│  └─────────────────────────────┘  ┌─────────────────────────────────────┐ │
│                                   │ FINGER STATES                       │ │
│                                   │ 👍 Thumb   ☑️ Up                    │ │
│                                   │ 👆 Index   ☑️ Up                    │ │
│                                   │ 🖐 Middle  ☑️ Up                    │ │
│                                   │ 💍 Ring    ☐  Down                  │ │
│                                   │ 🤙 Pinky   ☐  Down                  │ │
│                                   └─────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Project 2: Gesture Volume Controller

### Overview

**Control system audio with intuitive hand gestures.**

This project demonstrates:

- Pinch gesture recognition for precision control
- Smooth interpolation for natural feel
- System integration (pycaw)
- Visual feedback design
- Gesture cooldowns and debouncing

### Technical Scope

```
Difficulty: Intermediate
Engineering Depth:
  - Distance-based gesture detection
  - Gesture state machine (detecting → controlling → idle)
  - Platform-specific system integration
  - Smooth value interpolation

Real-Time Constraints:
  - Volume changes within 50ms of gesture
  - Smooth visual feedback
  - No audio artifacts during control
```

### Pipeline Architecture

```
┌─────────────┐    ┌─────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│  INGESTION  │───▶│ PREPROCESS  │───▶│     EXTRACTION       │───▶│      INFERENCE      │
│             │    │             │    │                      │    │                     │
│ Camera      │    │ Normalize   │    │ Thumb tip position   │    │ Pinch detector      │
│             │    │             │    │ Index tip position   │    │ Pinch distance      │
│             │    │             │    │ Pinch center Y       │    │ Volume delta calc   │
└─────────────┘    └─────────────┘    └──────────────────────┘    └─────────────────────┘
                                                                            │
                                                                            ▼
                                                                  ┌─────────────────────┐
                                                                  │       OUTPUT        │
                                                                  │                     │
                                                                  │ VolumeControlAction │
                                                                  │ System API call     │
                                                                  │ WebSocket feedback  │
                                                                  └─────────────────────┘
```

### Gesture Specification

**Pinch-to-Control Gesture:**

```
DETECTION PHASE:
  - Thumb to Index distance < 5% of frame width
  - Trigger: Distance crosses threshold for 3 frames

CONTROL PHASE:
  - Track pinch center Y position
  - Map vertical movement to volume delta
  - Y moves up → Volume increases
  - Y moves down → Volume decreases

RELEASE PHASE:
  - Pinch distance > 8% of frame width
  - Enter 10-frame cooldown
```

**Mute Gesture:**

```
FIST DETECTION:
  - All fingers curled (tips below PIPs)
  - Hold for 500ms → Toggle mute
```

### Dashboard Design

```
┌────────────────────────────────────────────────────────────────────────────┐
│ GESTURE VOLUME CONTROLLER                                   [Stop] [Gear] │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │                             │  │     VOLUME CONTROL                  │ │
│  │     [Hand Visualization]    │  │                                     │ │
│  │                             │  │  🔊 ████████████████░░░░ 72%        │ │
│  │     Pinch zone highlighted  │  │                                     │ │
│  │     when detecting          │  │     [Visualizer bars animated]     │ │
│  │                             │  │                                     │ │
│  │     Active control shown    │  │  Status: CONTROLLING                │ │
│  │     with green overlay      │  │  Movement: ↑ Increasing             │ │
│  │                             │  │                                     │ │
│  └─────────────────────────────┘  └─────────────────────────────────────┘ │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ GESTURE GUIDE                                                        │  │
│  │                                                                      │  │
│  │  👌 PINCH UP/DOWN          🤜 FIST                                   │  │
│  │  Volume Control            Toggle Mute                               │  │
│  │  Pinch thumb + index,      Make a fist and                          │  │
│  │  move hand up or down      hold for 500ms                           │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐ │
│  │ METRICS                  │  │ SESSION HISTORY                        │ │
│  │ Response time: 32ms      │  │ ▓▓▓▓░░░▓▓▓▓▓▓▓▓░░░▓▓▓▓▓░░░░░░░░░░░    │ │
│  │ Control precision: 98%   │  │ Volume changes over time               │ │
│  │ Gesture accuracy: 95%    │  │ Max: 100%  Min: 0%  Avg: 54%           │ │
│  └─────────────────────────┘  └─────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Project 3: Precision Virtual Mouse

### Overview

**Control cursor position and clicks with hand gestures.**

This project demonstrates:

- High-precision coordinate mapping
- Click gesture detection
- Smoothing algorithms (One Euro Filter)
- Calibration workflow
- Zone-based interaction areas

### Technical Scope

```
Difficulty: Advanced
Engineering Depth:
  - Cursor smoothing with One Euro Filter
  - Click detection with false-positive prevention
  - Screen coordinate mapping with calibration
  - Gesture zones for mode switching
  - Edge handling and bounds checking

Real-Time Constraints:
  - < 30ms cursor update latency
  - Zero perceptible jitter
  - Accurate click detection
```

### Pipeline Architecture

```
┌─────────────┐    ┌─────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│  INGESTION  │───▶│ PREPROCESS  │───▶│     EXTRACTION       │───▶│      INFERENCE      │
│             │    │             │    │                      │    │                     │
│ 60 FPS      │    │ High-res    │    │ Index tip tracking   │    │ Cursor position     │
│ (for mouse) │    │ Normalize   │    │ Thumb-index distance │    │ Click detection     │
│             │    │             │    │ Hand presence        │    │ Smoothing filter    │
└─────────────┘    └─────────────┘    └──────────────────────┘    └─────────────────────┘
                                                                            │
                                                                            ▼
                                                                  ┌─────────────────────┐
                                                                  │       OUTPUT        │
                                                                  │                     │
                                                                  │ CursorControlAction │
                                                                  │ pyautogui.moveTo()  │
                                                                  │ pyautogui.click()   │
                                                                  └─────────────────────┘
```

### Gesture Specification

**Cursor Control:**

```
INDEX FINGER TRACKING:
  - Track index fingertip (landmark 8)
  - Apply One Euro Filter for jitter removal
  - Map to screen coordinates via calibration matrix

DEAD ZONE:
  - 5% movement threshold before cursor moves
  - Prevents micro-movements when holding position

EDGE ACCELERATION:
  - When near screen edges, reduce movement sensitivity
  - Prevents cursor flying off screen
```

**Click Gestures:**

```
LEFT CLICK:
  - Pinch thumb to index finger
  - Distance < 3% frame width
  - Hold for minimum 150ms, maximum 500ms
  - Release triggers click

RIGHT CLICK:
  - Pinch thumb to middle finger
  - Same distance and timing rules

DOUBLE CLICK:
  - Two quick pinches within 400ms

DRAG:
  - Pinch and hold > 500ms
  - Movement while pinched = drag
  - Release = drop
```

### Calibration Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ CALIBRATION WIZARD                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1 of 4: Top-Left Corner                                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ●                                                        │  │
│  │                                                          │  │
│  │     Point at the TARGET with your index finger           │  │
│  │     and pinch to confirm                                 │  │
│  │                                                          │  │
│  │                                                          │  │
│  │                                                          │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Your position: (0.12, 0.08)                                   │
│  Target: Top-Left                                               │
│                                                                 │
│  [Skip Calibration]                     [This point looks good] │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Design

```
┌────────────────────────────────────────────────────────────────────────────┐
│ PRECISION VIRTUAL MOUSE                                     [Stop] [Gear] │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │                             │  │  CURSOR STATUS                      │ │
│  │     [Hand Visualization]    │  │                                     │ │
│  │                             │  │  ┌──────────────────────────────┐  │ │
│  │     Index finger highlighted│  │  │  [Mini screen representation] │  │ │
│  │     Click zones shown       │  │  │       ●                       │  │ │
│  │                             │  │  │    cursor                     │  │ │
│  │     Current mode indicator  │  │  │    position                   │  │ │
│  │                             │  │  └──────────────────────────────┘  │ │
│  └─────────────────────────────┘  │                                     │ │
│                                   │  Position: (1024, 568)              │ │
│                                   │  Mode: MOVE                         │ │
│                                   └─────────────────────────────────────┘ │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ GESTURE GUIDE                                                        │  │
│  │                                                                      │  │
│  │  👆 POINT           👌 PINCH            ✌️ TWO FINGER               │  │
│  │  Move Cursor       Left Click          Right Click                  │  │
│  │                                                                      │  │
│  │  ✊ HOLD PINCH      🔄 CALIBRATE                                    │  │
│  │  Drag & Drop       Recalibrate                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  [Recalibrate]  Calibration: GOOD  │  Smoothing: Enabled  │  Clicks: 23  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Project 4: Sign Language Alphabet

### Overview

**Recognize American Sign Language (ASL) alphabet letters.**

This project demonstrates:

- Static pose classification (26 classes)
- Machine learning integration
- Dataset collection workflow
- Model training pipeline
- Confidence-based feedback

### Technical Scope

```
Difficulty: Advanced
Engineering Depth:
  - Pre-trained model loading (TensorFlow Lite)
  - Real-time classification
  - Landmark feature engineering
  - Dataset collection mode
  - Model performance metrics

Real-Time Constraints:
  - Classification within 50ms
  - Stable predictions (temporal voting)
  - Graceful handling of ambiguous poses
```

### Pipeline Architecture

```
┌─────────────┐    ┌─────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│  INGESTION  │───▶│ PREPROCESS  │───▶│     EXTRACTION       │───▶│      INFERENCE      │
│             │    │             │    │                      │    │                     │
│ Camera      │    │ Normalize   │    │ 21 Landmarks         │    │ ASL Classifier      │
│             │    │             │    │ Normalized coords    │    │ TFLite model        │
│             │    │             │    │ Feature vector       │    │ Temporal voting     │
└─────────────┘    └─────────────┘    └──────────────────────┘    └─────────────────────┘
                                                                            │
                                                                            ▼
                                                                  ┌─────────────────────┐
                                                                  │       OUTPUT        │
                                                                  │                     │
                                                                  │ Letter prediction   │
                                                                  │ Confidence score    │
                                                                  │ Spelling buffer     │
                                                                  └─────────────────────┘
```

### Feature Engineering

```python
def extract_asl_features(landmarks: List[Landmark]) -> np.ndarray:
    """
    Extract features optimized for ASL classification.

    Features:
    1. Normalized landmark positions (63 values: 21 * 3)
    2. Inter-finger distances (10 values)
    3. Finger angles (5 values)
    4. Palm orientation (3 values)

    Total: 81-dimensional feature vector
    """
    features = []

    # Normalize positions relative to wrist (landmark 0)
    wrist = landmarks[0]
    for lm in landmarks:
        features.extend([
            lm.x - wrist.x,
            lm.y - wrist.y,
            lm.z - wrist.z
        ])

    # Add inter-finger distances
    fingertips = [4, 8, 12, 16, 20]
    for i, tip1 in enumerate(fingertips):
        for tip2 in fingertips[i+1:]:
            dist = calculate_distance(landmarks[tip1], landmarks[tip2])
            features.append(dist)

    # Add finger angles (MCP to TIP angle)
    # ... additional feature extraction

    return np.array(features)
```

### Dashboard Design

```
┌────────────────────────────────────────────────────────────────────────────┐
│ SIGN LANGUAGE ALPHABET                              [Collect] [Stop] [Gear]│
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │                             │  │  PREDICTION                         │ │
│  │     [Hand Visualization]    │  │                                     │ │
│  │                             │  │           ┌─────────┐               │ │
│  │     Current hand pose       │  │           │    A    │               │ │
│  │                             │  │           └─────────┘               │ │
│  │                             │  │       Confidence: 94%               │ │
│  │                             │  │                                     │ │
│  └─────────────────────────────┘  │  Top 3 Predictions:                 │ │
│                                   │  A: 94%  |  S: 4%  |  E: 2%         │ │
│                                   └─────────────────────────────────────┘ │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐│
│  │ SPELLING BUFFER                                                       ││
│  │                                                                       ││
│  │  H E L L O   W O R L D                                               ││
│  │                                                                       ││
│  │  [Clear]  [Space]  [Backspace]  [Copy]                               ││
│  └───────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐│
│  │ ALPHABET REFERENCE (hold pose for 1s to confirm)                      ││
│  │                                                                       ││
│  │  A B C D E F G H I J K L M N O P Q R S T U V W X Y Z                 ││
│  │  ✓   ✓             ✓     ✓                                           ││
│  │  (letters you've successfully signed this session)                    ││
│  └───────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Project 5: Gesture-Based Presentation Controller

### Overview

**Control presentation slides with air gestures.**

This project demonstrates:

- Discrete gesture recognition (swipe detection)
- Application focus management
- Multi-gesture vocabulary
- Zone-based controls
- Presentation mode UX

### Technical Scope

```
Difficulty: Intermediate
Engineering Depth:
  - Swipe gesture detection (velocity + direction)
  - Laser pointer mode (steady hand tracking)
  - Zone-based controls (left edge/right edge triggers)
  - Multi-application support (PowerPoint, Keynote, Google Slides)

Real-Time Constraints:
  - Swipe detection within 100ms
  - Smooth laser pointer tracking
  - No accidental slide changes
```

### Gesture Vocabulary

| Gesture       | Action                 | Detection Method                               |
| ------------- | ---------------------- | ---------------------------------------------- |
| Swipe Right   | Next Slide             | Palm moving right > 30% frame width in < 500ms |
| Swipe Left    | Previous Slide         | Palm moving left > 30% frame width in < 500ms  |
| Point (Index) | Laser Pointer          | Index extended, others curled                  |
| Open Palm     | Start/End Presentation | 5 fingers for 1 second                         |
| Thumbs Up     | Toggle Black Screen    | Thumbs up pose for 500ms                       |
| Fist          | Toggle Spotlight       | Fist for 500ms                                 |

### Dashboard Design

```
┌────────────────────────────────────────────────────────────────────────────┐
│ PRESENTATION CONTROLLER                      [Presentation Mode] [Gear]  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │   ⬅️ PREV                                             NEXT ➡️       │  │
│  │                                                                      │  │
│  │         [Large hand visualization area]                             │  │
│  │                                                                      │  │
│  │         Current gesture shown with overlay                          │  │
│  │                                                                      │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐ │
│  │ STATUS                   │  │ GESTURE GUIDE                          │ │
│  │                          │  │                                        │ │
│  │ Mode: ACTIVE             │  │ 👋➡️ Next   ⬅️👋 Previous             │ │
│  │ Slide: 5 / 24           │  │ 👆 Laser    ✋ Start/End               │ │
│  │ Last gesture: NEXT       │  │ 👍 Black    ✊ Spotlight               │ │
│  │ Confidence: 96%          │  │                                        │ │
│  └─────────────────────────┘  └─────────────────────────────────────────┘ │
│                                                                            │
│  [◀ Previous]  Slide 5/24  [Next ▶]       App: Microsoft PowerPoint     │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)

- ✅ Smart Finger Counter (enhanced version of existing)
- Core pipeline refactoring

### Phase 2: Control Projects (Week 3-4)

- 🔲 Gesture Volume Controller
- 🔲 Precision Virtual Mouse (basic version)

### Phase 3: Advanced Features (Week 5-6)

- 🔲 Virtual Mouse calibration & smoothing
- 🔲 Sign Language Alphabet (with pre-trained model)

### Phase 4: Application Integration (Week 7-8)

- 🔲 Presentation Controller
- 🔲 Cross-project polish & testing

---

## Success Criteria

Each project must demonstrate:

| Criterion       | Measurement                      | Target  |
| --------------- | -------------------------------- | ------- |
| **Accuracy**    | Correct gesture recognition rate | > 95%   |
| **Latency**     | End-to-end processing time       | < 50ms  |
| **Stability**   | Consecutive matching predictions | > 90%   |
| **Reliability** | Session uptime without errors    | > 99%   |
| **Usability**   | Time to learn core gestures      | < 2 min |

---

This document provides clear scope and specifications for each project, ensuring portfolio-quality implementations that demonstrate real engineering depth and practical utility.
