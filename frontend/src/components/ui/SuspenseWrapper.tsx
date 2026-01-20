import { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';
import styles from './SuspenseWrapper.module.css';

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minimal?: boolean;
}

const AppleStyleFallback: React.FC<{ minimal?: boolean }> = ({ minimal = false }) => (
  <div className={minimal ? styles.minimalContainer : styles.fallbackContainer}>
    <div className={styles.fallbackContent}>
      <LoadingSpinner size={minimal ? 'md' : 'lg'} />
      {!minimal && (
        <>
          <div className={styles.shimmerText} />
          <div className={styles.shimmerTextSmall} />
        </>
      )}
    </div>
  </div>
);

const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({ 
  children, 
  fallback,
  minimal = false 
}) => (
  <Suspense fallback={fallback || <AppleStyleFallback minimal={minimal} />}>
    {children}
  </Suspense>
);

export default SuspenseWrapper;
