'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ScrollWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

export default function ScrollWrapper({
  children,
  className,
  delay = 0,
  direction = 'up',
  distance = 50,
}: ScrollWrapperProps) {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.3,
  });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  const getDirectionVariants = () => {
    switch (direction) {
      case 'up':
        return {
          hidden: {
            opacity: 0,
            y: distance,
          },
          visible: {
            opacity: 1,
            y: 0,
          },
        };
      case 'down':
        return {
          hidden: {
            opacity: 0,
            y: -distance,
          },
          visible: {
            opacity: 1,
            y: 0,
          },
        };
      case 'left':
        return {
          hidden: {
            opacity: 0,
            x: distance,
          },
          visible: {
            opacity: 1,
            x: 0,
          },
        };
      case 'right':
        return {
          hidden: {
            opacity: 0,
            x: -distance,
          },
          visible: {
            opacity: 1,
            x: 0,
          },
        };
      default:
        return {
          hidden: {
            opacity: 0,
            y: distance,
          },
          visible: {
            opacity: 1,
            y: 0,
          },
        };
    }
  };

  const variants = getDirectionVariants();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
