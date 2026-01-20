"""
Inference Engine
Routes extraction results to appropriate gesture classifiers.
"""

import time
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from dataclasses import dataclass

from core.types import (
    ExtractionResult, InferenceResult, GestureType,
    FingerStates
)
from core.exceptions import InferenceError
from core.logging_config import get_logger

logger = get_logger(__name__)


class GestureClassifier(ABC):
    """
    Abstract base class for gesture classifiers.
    
    Each project implements its own classifier that converts
    extracted hand landmarks into gesture classifications.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Unique classifier name/identifier."""
        pass
    
    @property
    @abstractmethod
    def supported_gestures(self) -> List[GestureType]:
        """List of gesture types this classifier can detect."""
        pass
    
    @abstractmethod
    def classify(self, extraction: ExtractionResult) -> InferenceResult:
        """
        Classify gestures from extracted hand data.
        
        Args:
            extraction: ExtractionResult from extraction pipeline
            
        Returns:
            InferenceResult with classified gesture
        """
        pass
    
    def reset(self):
        """Reset classifier state (for stateful classifiers)."""
        pass


class InferenceEngine:
    """
    Inference engine that manages multiple gesture classifiers.
    
    Routes extraction results to the currently active classifier
    and returns inference results.
    
    Usage:
        engine = InferenceEngine()
        engine.register_classifier(FingerCountClassifier())
        engine.set_active_classifier("finger_count")
        
        result = engine.infer(extraction_result)
    """
    
    _instance: Optional['InferenceEngine'] = None
    
    def __init__(self):
        self._classifiers: Dict[str, GestureClassifier] = {}
        self._active_classifier: Optional[str] = None
        self._inference_times: list = []
    
    @classmethod
    def get_instance(cls) -> 'InferenceEngine':
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    @property
    def average_latency(self) -> float:
        """Get average inference latency in ms."""
        if not self._inference_times:
            return 0.0
        return sum(self._inference_times[-100:]) / len(self._inference_times[-100:])
    
    @property
    def active_classifier_name(self) -> Optional[str]:
        """Get name of active classifier."""
        return self._active_classifier
    
    @property
    def available_classifiers(self) -> List[str]:
        """Get list of registered classifier names."""
        return list(self._classifiers.keys())
    
    def register_classifier(self, classifier: GestureClassifier) -> None:
        """
        Register a gesture classifier.
        
        Args:
            classifier: GestureClassifier instance to register
        """
        self._classifiers[classifier.name] = classifier
        logger.info(f"Registered classifier: {classifier.name}")
        
        # Auto-activate if this is the first classifier
        if self._active_classifier is None:
            self._active_classifier = classifier.name
    
    def unregister_classifier(self, name: str) -> bool:
        """
        Unregister a classifier by name.
        
        Args:
            name: Classifier name to unregister
            
        Returns:
            True if removed, False if not found
        """
        if name in self._classifiers:
            del self._classifiers[name]
            
            if self._active_classifier == name:
                self._active_classifier = None
            
            logger.info(f"Unregistered classifier: {name}")
            return True
        
        return False
    
    def set_active_classifier(self, name: str) -> bool:
        """
        Set the active classifier by name.
        
        Args:
            name: Name of classifier to activate
            
        Returns:
            True if activated, False if not found
        """
        if name not in self._classifiers:
            logger.warning(f"Classifier not found: {name}")
            return False
        
        old_classifier = self._active_classifier
        self._active_classifier = name
        
        # Reset the new classifier's state
        self._classifiers[name].reset()
        
        logger.info(f"Active classifier changed: {old_classifier} -> {name}")
        return True
    
    def get_classifier(self, name: str) -> Optional[GestureClassifier]:
        """Get classifier by name."""
        return self._classifiers.get(name)
    
    def infer(self, extraction: ExtractionResult) -> Optional[InferenceResult]:
        """
        Perform inference using the active classifier.
        
        Args:
            extraction: ExtractionResult from extraction pipeline
            
        Returns:
            InferenceResult if classifier is active, None otherwise
            
        Raises:
            InferenceError: If inference fails
        """
        if not self._active_classifier:
            return None
        
        classifier = self._classifiers.get(self._active_classifier)
        if not classifier:
            return None
        
        start_time = time.perf_counter()
        
        try:
            result = classifier.classify(extraction)
            
            inference_latency = (time.perf_counter() - start_time) * 1000
            self._inference_times.append(inference_latency)
            
            # Update latency in result if not set
            if result.inference_latency_ms == 0:
                result.inference_latency_ms = inference_latency
            
            return result
            
        except Exception as e:
            raise InferenceError(
                f"Inference failed in {self._active_classifier}: {e}",
                cause=e
            )
    
    def reset_all(self):
        """Reset state of all classifiers."""
        for classifier in self._classifiers.values():
            classifier.reset()
        
        self._inference_times.clear()
        logger.info("All classifiers reset")
