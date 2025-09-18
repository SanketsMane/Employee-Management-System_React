import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';

// Lazy load components for better performance
const LazyContactForm = lazy(() => import('../components/ContactForm'));
const LazyFooter = lazy(() => import('../components/Footer'));
const LazyCompanyLogosCarousel = lazy(() => import('../components/CompanyLogosCarousel'));

// Loading component with skeleton
const LoadingSkeleton = ({ className = "" }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-4 w-full mb-2"></div>
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-4 w-3/4 mb-2"></div>
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-4 w-1/2"></div>
  </div>
);

// Wrapper component with error boundary
const LazyWrapper = ({ children, fallback, ...props }) => (
  <Suspense 
    fallback={
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full"
      >
        {fallback || <LoadingSkeleton className="h-32" />}
      </motion.div>
    }
  >
    {children}
  </Suspense>
);

export { LazyContactForm, LazyFooter, LazyCompanyLogosCarousel, LazyWrapper, LoadingSkeleton };