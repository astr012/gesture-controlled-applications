"""
Projects API Endpoints
CRUD operations for gesture projects.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum

from core.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/projects")


class ProjectCategory(str, Enum):
    """Project difficulty category."""
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERIMENTAL = "experimental"


class ProjectStatus(str, Enum):
    """Project availability status."""
    AVAILABLE = "available"
    RUNNING = "running"
    DISABLED = "disabled"
    ERROR = "error"


class ProjectMetadata(BaseModel):
    """Project metadata for listing."""
    id: str
    name: str
    description: str
    icon: str
    category: ProjectCategory
    version: str
    status: ProjectStatus
    features: List[str] = []
    requirements: List[str] = []


class ProjectSettings(BaseModel):
    """Project-specific settings."""
    display_mode: str = Field(default="detailed")
    show_debug_info: bool = Field(default=False)
    sensitivity: float = Field(default=0.5, ge=0, le=1)
    custom_settings: Dict[str, Any] = Field(default_factory=dict)


class ProjectListResponse(BaseModel):
    """Response for project listing."""
    projects: List[ProjectMetadata]
    total: int
    enabled_count: int


class ProjectDetailResponse(BaseModel):
    """Detailed project information."""
    project: ProjectMetadata
    settings: ProjectSettings


# In-memory project definitions (would come from database in production)
_PROJECTS = {
    "finger_count": ProjectMetadata(
        id="finger_count",
        name="Smart Finger Counter",
        description="Real-time finger counting with pose detection and gesture recognition",
        icon="✋",
        category=ProjectCategory.BASIC,
        version="2.0.0",
        status=ProjectStatus.AVAILABLE,
        features=[
            "Multi-hand tracking",
            "Pose classification (peace, thumbs up, fist)",
            "Temporal smoothing",
            "Per-finger state detection"
        ],
        requirements=["Camera", "MediaPipe"]
    ),
    "volume_control": ProjectMetadata(
        id="volume_control",
        name="Gesture Volume Controller",
        description="Control system audio volume with intuitive pinch gestures",
        icon="🔊",
        category=ProjectCategory.INTERMEDIATE,
        version="2.0.0",
        status=ProjectStatus.AVAILABLE,
        features=[
            "Pinch-to-control gesture",
            "Smooth volume interpolation",
            "Mute toggle gesture",
            "Visual feedback"
        ],
        requirements=["Camera", "MediaPipe", "pycaw (Windows)"]
    ),
    "virtual_mouse": ProjectMetadata(
        id="virtual_mouse",
        name="Precision Virtual Mouse",
        description="Control cursor position and clicks with hand gestures",
        icon="🖱️",
        category=ProjectCategory.ADVANCED,
        version="2.0.0",
        status=ProjectStatus.AVAILABLE,
        features=[
            "High-precision cursor tracking",
            "Click gesture detection",
            "One Euro Filter smoothing",
            "Calibration workflow"
        ],
        requirements=["Camera", "MediaPipe", "pyautogui"]
    )
}

_PROJECT_SETTINGS: Dict[str, ProjectSettings] = {
    "finger_count": ProjectSettings(display_mode="detailed", sensitivity=0.5),
    "volume_control": ProjectSettings(
        display_mode="minimal",
        sensitivity=0.7,
        custom_settings={"volume_step": 0.05}
    ),
    "virtual_mouse": ProjectSettings(
        display_mode="detailed",
        sensitivity=0.9,
        custom_settings={"smoothing_enabled": True}
    )
}


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    category: Optional[ProjectCategory] = None,
    enabled_only: bool = True
):
    """
    List all available gesture projects.
    
    Args:
        category: Filter by category
        enabled_only: Only show enabled projects
        
    Returns:
        ProjectListResponse with project list
    """
    projects = list(_PROJECTS.values())
    
    if category:
        projects = [p for p in projects if p.category == category]
    
    if enabled_only:
        projects = [p for p in projects if p.status != ProjectStatus.DISABLED]
    
    enabled_count = len([p for p in _PROJECTS.values() if p.status == ProjectStatus.AVAILABLE])
    
    return ProjectListResponse(
        projects=projects,
        total=len(projects),
        enabled_count=enabled_count
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(project_id: str):
    """
    Get detailed information about a specific project.
    
    Args:
        project_id: Project identifier
        
    Returns:
        ProjectDetailResponse with full project details
    """
    if project_id not in _PROJECTS:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")
    
    project = _PROJECTS[project_id]
    settings = _PROJECT_SETTINGS.get(project_id, ProjectSettings())
    
    return ProjectDetailResponse(
        project=project,
        settings=settings
    )


@router.put("/{project_id}/settings", response_model=ProjectSettings)
async def update_project_settings(project_id: str, settings: ProjectSettings):
    """
    Update settings for a specific project.
    
    Args:
        project_id: Project identifier
        settings: New settings
        
    Returns:
        Updated ProjectSettings
    """
    if project_id not in _PROJECTS:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")
    
    _PROJECT_SETTINGS[project_id] = settings
    logger.info(f"Updated settings for project: {project_id}")
    
    return settings


@router.post("/{project_id}/start")
async def start_project(project_id: str):
    """
    Start/activate a gesture project.
    
    This initializes the pipeline and begins gesture processing.
    """
    if project_id not in _PROJECTS:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")
    
    try:
        from core.dependencies import get_pipeline_orchestrator
        
        orchestrator = get_pipeline_orchestrator()
        await orchestrator.start(project_id)
        
        # Update project status
        _PROJECTS[project_id].status = ProjectStatus.RUNNING
        
        return {
            "status": "started",
            "project_id": project_id,
            "message": f"Project {project_id} is now running"
        }
        
    except Exception as e:
        logger.error(f"Failed to start project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{project_id}/stop")
async def stop_project(project_id: str):
    """
    Stop/deactivate a gesture project.
    """
    if project_id not in _PROJECTS:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")
    
    try:
        from core.dependencies import get_pipeline_orchestrator
        
        orchestrator = get_pipeline_orchestrator()
        await orchestrator.stop()
        
        # Update project status
        _PROJECTS[project_id].status = ProjectStatus.AVAILABLE
        
        return {
            "status": "stopped",
            "project_id": project_id,
            "message": f"Project {project_id} has been stopped"
        }
        
    except Exception as e:
        logger.error(f"Failed to stop project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/metrics")
async def get_project_metrics(project_id: str):
    """
    Get runtime metrics for a project.
    """
    if project_id not in _PROJECTS:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")
    
    try:
        from core.dependencies import get_pipeline_orchestrator
        
        orchestrator = get_pipeline_orchestrator()
        
        if orchestrator.current_project != project_id:
            return {
                "project_id": project_id,
                "status": "not_running",
                "metrics": None
            }
        
        return {
            "project_id": project_id,
            "status": "running",
            "metrics": orchestrator.get_detailed_metrics()
        }
        
    except Exception as e:
        logger.error(f"Failed to get metrics for {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
