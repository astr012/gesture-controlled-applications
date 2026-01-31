/**
 * Service Layer - Barrel Export
 *
 * Centralized access to all application services.
 */

export { default as GestureService } from './GestureService';
export type { GestureServiceConfig, ConnectionStatus } from './GestureService';

export { default as ProjectService } from './ProjectService';
export type { ProjectState } from './ProjectService';
