/**
 * Router and Code Splitting Tests
 */

import { projectRegistry, getProjectById, getProjectByRoute } from '@/projects/registry';

describe('Router and Code Splitting', () => {
  describe('Project Registry', () => {
    it('should have all expected projects configured', () => {
      const projects = projectRegistry.projects;
      expect(projects).toHaveLength(3);
      
      const projectIds = projects.map(p => p.id);
      expect(projectIds).toContain('finger_count');
      expect(projectIds).toContain('volume_control');
      expect(projectIds).toContain('virtual_mouse');
    });

    it('should have proper route configuration for each project', () => {
      const projects = projectRegistry.projects;
      projects.forEach(project => {
        expect(project.route).toBeDefined();
        expect(project.route).toMatch(/^\/project\//);
        expect(project.loader).toBeDefined();
      });
    });

    it('should have all projects enabled by default', () => {
      const enabledProjects = projectRegistry.getEnabledProjects();
      expect(enabledProjects).toHaveLength(3);
    });

    it('should find projects by ID', () => {
      const fingerCount = getProjectById('finger_count');
      expect(fingerCount).toBeDefined();
      expect(fingerCount?.name).toBe('Finger Counting');
    });

    it('should find projects by route', () => {
      const fingerCount = getProjectByRoute('/project/finger-count');
      expect(fingerCount).toBeDefined();
      expect(fingerCount?.id).toBe('finger_count');
    });
  });

  describe('Deep Linking Support', () => {
    it('should support URL-friendly project routes', () => {
      const projects = projectRegistry.projects;
      const fingerCountProject = projects.find(p => p.id === 'finger_count');
      const volumeControlProject = projects.find(p => p.id === 'volume_control');
      const virtualMouseProject = projects.find(p => p.id === 'virtual_mouse');

      expect(fingerCountProject?.route).toBe('/project/finger-count');
      expect(volumeControlProject?.route).toBe('/project/volume-control');
      expect(virtualMouseProject?.route).toBe('/project/virtual-mouse');
    });
  });

  describe('Code Splitting', () => {
    it('should have lazy loaders for all projects', () => {
      const projects = projectRegistry.projects;
      projects.forEach(project => {
        expect(typeof project.loader).toBe('function');
      });
    });

    it('should have valid lazy components from project loaders', () => {
      const projects = projectRegistry.projects;
      projects.forEach(project => {
        const result = project.loader();
        expect(result).toBeDefined();
        // Lazy components have a $$typeof property
        expect(result).toHaveProperty('$$typeof');
      });
    });
  });
});