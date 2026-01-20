import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import styles from './NotFound.module.css';

const NotFound: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className={styles.actions}>
          <Link to="/">
            <Button variant="primary" size="lg">
              Go to Dashboard
            </Button>
          </Link>
          <Button 
            variant="secondary" 
            size="lg"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
