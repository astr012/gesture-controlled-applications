"""
Volume Control Actions
=======================

System actions for controlling audio volume.
"""

import asyncio
import platform
from typing import Optional

from core.types import InferenceResult, GestureType
from pipelines.output.dispatcher import OutputAction
from core.logging_config import get_logger

logger = get_logger(__name__)


class VolumeControlActions(OutputAction):
    """
    System volume control actions.
    
    Supports Windows (pycaw), macOS (osascript), and Linux (amixer).
    """
    
    def __init__(self):
        self._platform = platform.system()
        self._volume_interface = None
        self._last_volume: float = 0.5
        self._initialized = False
        
        self._initialize_volume_interface()
    
    @property
    def name(self) -> str:
        return "volume_control"
    
    def _initialize_volume_interface(self):
        """Initialize platform-specific volume interface."""
        if self._platform == "Windows":
            self._init_windows_volume()
        elif self._platform == "Darwin":
            self._initialized = True  # macOS uses osascript
        elif self._platform == "Linux":
            self._initialized = True  # Linux uses amixer
        else:
            logger.warning(f"Unsupported platform: {self._platform}")
    
    def _init_windows_volume(self):
        """Initialize Windows volume control using pycaw."""
        try:
            from ctypes import cast, POINTER
            from comtypes import CLSCTX_ALL
            from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
            
            devices = AudioUtilities.GetSpeakers()
            interface = devices.Activate(
                IAudioEndpointVolume._iid_,
                CLSCTX_ALL,
                None
            )
            self._volume_interface = cast(interface, POINTER(IAudioEndpointVolume))
            self._initialized = True
            logger.info("Windows volume interface initialized")
            
        except ImportError:
            logger.error("pycaw not installed. Run: pip install pycaw")
        except Exception as e:
            logger.error(f"Failed to initialize Windows volume: {e}")
    
    async def execute(self, inference: InferenceResult) -> bool:
        """
        Execute volume control action.
        
        Args:
            inference: Inference result with volume data
            
        Returns:
            True if action was executed
        """
        if not self._initialized:
            return False
        
        # Get volume level from raw output
        raw = inference.raw_output
        volume_level = raw.get("volume_level", self._last_volume)
        is_muted = raw.get("is_muted", False)
        mute_toggled = raw.get("mute_toggled", False)
        
        try:
            # Handle mute toggle
            if mute_toggled:
                await self._set_mute(is_muted)
                logger.info(f"Mute toggled: {is_muted}")
                return True
            
            # Handle volume change
            if abs(volume_level - self._last_volume) > 0.01:
                await self._set_volume(volume_level)
                self._last_volume = volume_level
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Volume control error: {e}")
            return False
    
    async def _set_volume(self, level: float):
        """Set system volume level (0.0 - 1.0)."""
        level = max(0.0, min(1.0, level))
        
        if self._platform == "Windows":
            await self._set_volume_windows(level)
        elif self._platform == "Darwin":
            await self._set_volume_macos(level)
        elif self._platform == "Linux":
            await self._set_volume_linux(level)
    
    async def _set_volume_windows(self, level: float):
        """Set volume on Windows."""
        if self._volume_interface:
            # pycaw uses linear scale
            self._volume_interface.SetMasterVolumeLevelScalar(level, None)
    
    async def _set_volume_macos(self, level: float):
        """Set volume on macOS."""
        volume_percent = int(level * 100)
        cmd = f"osascript -e 'set volume output volume {volume_percent}'"
        
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
    
    async def _set_volume_linux(self, level: float):
        """Set volume on Linux."""
        volume_percent = int(level * 100)
        
        # Try amixer first (ALSA)
        cmd = f"amixer sset Master {volume_percent}%"
        
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        _, stderr = await process.communicate()
        
        if process.returncode != 0:
            # Try pactl (PulseAudio)
            cmd = f"pactl set-sink-volume @DEFAULT_SINK@ {volume_percent}%"
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await process.communicate()
    
    async def _set_mute(self, muted: bool):
        """Set system mute state."""
        if self._platform == "Windows":
            if self._volume_interface:
                self._volume_interface.SetMute(muted, None)
        
        elif self._platform == "Darwin":
            state = "true" if muted else "false"
            cmd = f"osascript -e 'set volume output muted {state}'"
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await process.communicate()
        
        elif self._platform == "Linux":
            state = "mute" if muted else "unmute"
            cmd = f"amixer sset Master {state}"
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await process.communicate()
    
    def get_current_volume(self) -> Optional[float]:
        """Get current system volume level."""
        if self._platform == "Windows" and self._volume_interface:
            return self._volume_interface.GetMasterVolumeLevelScalar()
        return self._last_volume
    
    def is_muted(self) -> bool:
        """Check if system is muted."""
        if self._platform == "Windows" and self._volume_interface:
            return bool(self._volume_interface.GetMute())
        return False
