import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';

const AnimatedCounter = ({ value, duration = 2, suffix = '', prefix = '' }) => {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      let finalValue = parseInt(value.replace(/[^0-9.]/g, ''));
      motionValue.set(finalValue);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getFormattedValue = () => {
    const numericValue = parseInt(value.replace(/[^0-9.]/g, ''));
    const currentValue = isInView ? displayValue : 0;
    
    if (value.includes('K')) {
      return currentValue >= 1000 ? formatNumber(currentValue) : currentValue.toString();
    } else if (value.includes('%')) {
      return currentValue.toString();
    } else if (value.includes('+')) {
      return currentValue >= 1000 ? formatNumber(currentValue) + '+' : currentValue + '+';
    }
    
    return currentValue.toString();
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <motion.div 
        className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {prefix}{getFormattedValue()}{suffix}
      </motion.div>
    </motion.div>
  );
};

export default AnimatedCounter;