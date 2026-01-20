import React from 'react';
import styles from './LoadingSpinner.module.css';

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'shimmer';

interface LoadingSpinnerProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  className?: string;
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  className = '',
  text,
  fullScreen = false,
  overlay = false,
}) => {
  const containerClass = `
    ${styles.container} 
    ${fullScreen ? styles.fullScreen : ''} 
    ${overlay ? styles.overlay : ''} 
    ${className}
  `.trim();

  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`${styles.dots} ${styles[size]}`}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`${styles.pulse} ${styles[size]}`}>
            <div className={styles.pulseCircle}></div>
          </div>
        );
      
      case 'shimmer':
        return (
          <div className={`${styles.shimmer} ${styles[size]}`}>
            <div className={styles.shimmerLine}></div>
            <div className={styles.shimmerLine}></div>
            <div className={styles.shimmerLine}></div>
          </div>
        );
      
      case 'spinner':
      default:
        return (
          <div className={`${styles.spinner} ${styles[size]}`}>
            <div className={styles.circle}></div>
          </div>
        );
    }
  };

  return (
    <div className={containerClass}>
      <div className={styles.content}>
        {renderLoadingIndicator()}
        {text && <p className={styles.text}>{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
