import React from 'react';
import { useParams } from 'react-router-dom';

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div>
      <h1>Project View</h1>
      <p>Project ID: {projectId}</p>
    </div>
  );
};

export default ProjectView;
