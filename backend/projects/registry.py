"""
Project Registry
Central registry for all gesture control projects.
"""

from typing import Dict, List, Optional, Type
from dataclasses import dataclass, field
from enum import Enum

from pipelines.inference.engine import GestureClassifier
from core.logging_config import get_logger

logger = get_logger(__name__)


class ProjectCategory(str, Enum):
    """Project difficulty category."""
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERIMENTAL = "experimental"


class ProjectStatus(str, Enum):
    """Project availability status."""
    AVAILABLE = "available"
    DISABLED = "disabled"
    EXPERIMENTAL = "experimental"
    DEPRECATED = "deprecated"


@dataclass
class ProjectDefinition:
    """Definition of a gesture control project."""
    id: str
    name: str
    description: str
    icon: str
    category: ProjectCategory
    version: str = "2.0.0"
    status: ProjectStatus = ProjectStatus.AVAILABLE
    
    # Technical configuration
    classifier_name: str = ""
    supported_gestures: List[str] = field(default_factory=list)
    
    # UI configuration
    features: List[str] = field(default_factory=list)
    requirements: List[str] = field(default_factory=list)
    
    # Default settings
    default_settings: Dict = field(default_factory=dict)


class ProjectRegistry:
    """
    Central registry for managing gesture control projects.
    
    Holds project definitions and their associated classifiers.
    """
    
    def __init__(self):
        self._projects: Dict[str, ProjectDefinition] = {}
        self._classifiers: Dict[str, Type[GestureClassifier]] = {}
        
        # Register built-in projects
        self._register_builtin_projects()
    
    def _register_builtin_projects(self):
        """Register all built-in projects."""
        
        # Finger Count Project
        self.register_project(ProjectDefinition(
            id="finger_count",
            name="Smart Finger Counter",
            description="Real-time finger counting with pose detection and gesture recognition",
            icon="✋",
            category=ProjectCategory.BASIC,
            classifier_name="finger_count",
            supported_gestures=[
                "finger_count", "fist", "open_palm", 
                "peace", "thumbs_up", "pointing"
            ],
            features=[
                "Multi-hand tracking (up to 2 hands)",
                "Pose classification (peace, thumbs up, fist)",
                "Temporal smoothing for stable detection",
                "Per-finger state detection",
                "Real-time visualization"
            ],
            requirements=["Camera", "MediaPipe Hands"],
            default_settings={
                "smoothing_frames": 3,
                "enable_thumb": True,
                "display_mode": "detailed"
            }
        ))
        
        # Volume Control Project
        self.register_project(ProjectDefinition(
            id="volume_control",
            name="Gesture Volume Controller",
            description="Control system audio volume with intuitive pinch gestures",
            icon="🔊",
            category=ProjectCategory.INTERMEDIATE,
            classifier_name="volume_control",
            supported_gestures=["pinch", "fist"],
            features=[
                "Pinch-to-control gesture",
                "Smooth volume interpolation",
                "Mute toggle with fist gesture",
                "Visual volume feedback",
                "Gesture cooldown prevention"
            ],
            requirements=["Camera", "MediaPipe Hands", "pycaw (Windows)"],
            default_settings={
                "volume_step": 0.05,
                "pinch_threshold": 0.05,
                "mute_hold_duration": 500
            }
        ))
        
        # Virtual Mouse Project
        self.register_project(ProjectDefinition(
            id="virtual_mouse",
            name="Precision Virtual Mouse",
            description="Control cursor position and clicks with hand gestures",
            icon="🖱️",
            category=ProjectCategory.ADVANCED,
            classifier_name="virtual_mouse",
            supported_gestures=["pointing", "pinch", "drag"],
            features=[
                "High-precision cursor tracking",
                "Click gesture detection (left/right)",
                "One Euro Filter smoothing",
                "Drag and drop support",
                "Calibration workflow"
            ],
            requirements=["Camera", "MediaPipe Hands", "pyautogui"],
            default_settings={
                "smoothing_enabled": True,
                "smoothing_beta": 0.01,
                "click_threshold": 0.03,
                "double_click_interval": 400
            }
        ))
        
        # Sign Language Project
        self.register_project(ProjectDefinition(
            id="sign_language",
            name="Sign Language Alphabet",
            description="Recognize American Sign Language (ASL) alphabet letters",
            icon="🤟",
            category=ProjectCategory.ADVANCED,
            status=ProjectStatus.EXPERIMENTAL,
            classifier_name="sign_language",
            supported_gestures=list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
            features=[
                "26-letter ASL alphabet recognition",
                "TensorFlow Lite classification",
                "Spelling buffer with word suggestions",
                "Temporal voting for stability",
                "Dataset collection mode"
            ],
            requirements=["Camera", "MediaPipe Hands", "TensorFlow Lite"],
            default_settings={
                "confirmation_frames": 10,
                "min_confidence": 0.85
            }
        ))
        
        # Presentation Controller Project
        self.register_project(ProjectDefinition(
            id="presentation",
            name="Presentation Controller",
            description="Control presentation slides with air gestures",
            icon="📊",
            category=ProjectCategory.INTERMEDIATE,
            classifier_name="presentation",
            supported_gestures=["swipe_left", "swipe_right", "pointing", "fist"],
            features=[
                "Swipe gestures for navigation",
                "Laser pointer mode",
                "Black screen toggle",
                "Multi-application support",
                "Gesture zone detection"
            ],
            requirements=["Camera", "MediaPipe Hands", "pyautogui"],
            default_settings={
                "swipe_threshold": 0.3,
                "swipe_max_duration": 500,
                "laser_mode_enabled": True
            }
        ))
        
        logger.info(f"Registered {self.project_count} built-in projects")
    
    def register_project(self, project: ProjectDefinition) -> bool:
        """
        Register a new project.
        
        Args:
            project: ProjectDefinition to register
            
        Returns:
            True if registered successfully
        """
        if project.id in self._projects:
            logger.warning(f"Project already registered: {project.id}")
            return False
        
        self._projects[project.id] = project
        logger.debug(f"Registered project: {project.id}")
        return True
    
    def unregister_project(self, project_id: str) -> bool:
        """
        Unregister a project.
        
        Args:
            project_id: ID of project to remove
            
        Returns:
            True if removed, False if not found
        """
        if project_id in self._projects:
            del self._projects[project_id]
            return True
        return False
    
    def get_project(self, project_id: str) -> Optional[ProjectDefinition]:
        """Get project by ID."""
        return self._projects.get(project_id)
    
    def list_projects(
        self,
        category: Optional[ProjectCategory] = None,
        include_disabled: bool = False
    ) -> List[ProjectDefinition]:
        """
        List all registered projects.
        
        Args:
            category: Filter by category
            include_disabled: Include disabled projects
            
        Returns:
            List of ProjectDefinition objects
        """
        projects = list(self._projects.values())
        
        if category:
            projects = [p for p in projects if p.category == category]
        
        if not include_disabled:
            projects = [p for p in projects if p.status != ProjectStatus.DISABLED]
        
        return projects
    
    @property
    def project_count(self) -> int:
        """Get total number of registered projects."""
        return len(self._projects)
    
    @property
    def available_projects(self) -> List[str]:
        """Get list of available project IDs."""
        return [
            p.id for p in self._projects.values()
            if p.status == ProjectStatus.AVAILABLE
        ]
    
    def register_classifier(
        self,
        project_id: str,
        classifier_class: Type[GestureClassifier]
    ) -> bool:
        """
        Register a classifier class for a project.
        
        Args:
            project_id: Project ID
            classifier_class: GestureClassifier class
            
        Returns:
            True if registered successfully
        """
        if project_id not in self._projects:
            logger.warning(f"Cannot register classifier for unknown project: {project_id}")
            return False
        
        self._classifiers[project_id] = classifier_class
        return True
    
    def get_classifier_class(
        self,
        project_id: str
    ) -> Optional[Type[GestureClassifier]]:
        """Get classifier class for a project."""
        return self._classifiers.get(project_id)
    
    def create_classifier(
        self,
        project_id: str,
        **kwargs
    ) -> Optional[GestureClassifier]:
        """
        Create a classifier instance for a project.
        
        Args:
            project_id: Project ID
            **kwargs: Arguments to pass to classifier constructor
            
        Returns:
            GestureClassifier instance or None
        """
        classifier_class = self._classifiers.get(project_id)
        
        if classifier_class:
            return classifier_class(**kwargs)
        
        # Fallback: try to create from built-in classifiers
        if project_id == "finger_count":
            from pipelines.inference.classifiers.finger_count import FingerCountClassifier
            return FingerCountClassifier(**kwargs)
        
        return None
