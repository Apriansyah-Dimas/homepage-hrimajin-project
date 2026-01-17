'use client';

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import TiltedCard from './TiltedCard';
import RotatingText from './RotatingText';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lastTouchY = useRef<number | null>(null);
  const virtualScroll = useMotionValue(0);
  const [progressValue, setProgressValue] = useState(0);

  useMotionValueEvent(virtualScroll, 'change', (latest) => {
    setProgressValue(latest);
  });

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const next = clamp(
        virtualScroll.get() + event.deltaY * 0.0012,
        0,
        1,
      );
      virtualScroll.set(next);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [virtualScroll]);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        lastTouchY.current = event.touches[0].clientY;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0 || lastTouchY.current === null) return;
      const currentY = event.touches[0].clientY;
      const deltaY = lastTouchY.current - currentY;
      if (deltaY !== 0) {
        event.preventDefault();
        const next = clamp(
          virtualScroll.get() + deltaY * 0.002,
          0,
          1,
        );
        virtualScroll.set(next);
      }
      lastTouchY.current = currentY;
    };

    const handleTouchEnd = () => {
      lastTouchY.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [virtualScroll]);

  const heroBlur = useTransform(
    virtualScroll,
    [0, 0.35, 0.65, 1],
    [0, 2, 12, 24],
  );
  const heroOpacity = useTransform(
    virtualScroll,
    [0, 0.5, 0.85],
    [1, 0.65, 0],
  );
  const heroScale = useTransform(virtualScroll, [0, 1], [1, 0.9]);
  const heroY = useTransform(virtualScroll, [0, 1], [0, 0]);
  const heroFilter = useTransform(heroBlur, (value) => `blur(${value}px)`);

  const cardsOpacity = useTransform(
    virtualScroll,
    [0.85, 0.95, 1],
    [0, 1, 1],
  );
  const cardsY = useTransform(virtualScroll, [0.85, 1], [100, 0]);
  const cardsBlur = useTransform(virtualScroll, [0.85, 0.95, 1], [18, 8, 0]);
  const scrollHintOpacity = useTransform(virtualScroll, [0, 0.6], [1, 0]);
  const cardsFilter = useTransform(cardsBlur, (value) => `blur(${value}px)`);

  const lineOneWords = ['Welcome', 'to', 'HR', 'Imajin,'];
  const lineTwoWords = ['your', 'internal'];
  const rotatingWords = ['Platform', 'System', 'Services'];

  return (
    <>
      {/* Target Cursor */}

      <section
        ref={sectionRef}
        className="relative h-screen w-full overflow-hidden"
      >
        {/* Hero stack */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center px-4"
          style={{
            filter: heroFilter,
            opacity: heroOpacity,
            scale: heroScale,
            y: heroY,
            pointerEvents: progressValue > 0.7 ? 'none' : 'auto',
          }}
        >
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(99, 101, 185, 0.3) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <motion.div
            className="relative z-10 max-w-5xl w-full mx-auto px-2 sm:px-4 text-left flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex flex-col items-start gap-2">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight flex flex-col gap-2 text-left">
              <span>
                {lineOneWords.map((word, index) => (
                  <motion.span
                    key={index}
                    className="inline-block"
                    initial={{
                      opacity: 0,
                      filter: 'blur(10px)',
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      filter: 'blur(0px)',
                      y: 0,
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3 + index * 0.08,
                      ease: [0.25, 0.1, 0.25, 1] as const,
                    }}
                    style={{
                      background:
                        'linear-gradient(135deg, #ededed 0%, #6365b9 50%, #8a8cd1 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {word}
                    {index !== lineOneWords.length - 1 ? '\u00a0' : ''}
                  </motion.span>
                ))}
              </span>
              <span>
                {lineTwoWords.map((word, index) => (
                  <motion.span
                    key={index}
                    className="inline-block"
                    initial={{
                      opacity: 0,
                      filter: 'blur(10px)',
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      filter: 'blur(0px)',
                      y: 0,
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3 + index * 0.08,
                      ease: [0.25, 0.1, 0.25, 1] as const,
                    }}
                    style={{
                      background:
                        'linear-gradient(135deg, #ededed 0%, #6365b9 50%, #8a8cd1 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {word}
                    {index !== lineTwoWords.length - 1 ? '\u00a0' : ''}
                  </motion.span>
                ))}
                {' '}
                <motion.span
                  className="inline-flex items-center ml-2"
                  initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 + lineTwoWords.length * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <RotatingText
                    texts={rotatingWords}
                    rotationInterval={3200}
                    staggerDuration={0.02}
                    staggerFrom="first"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '-120%', opacity: 0 }}
                    mainClassName="inline-flex items-center"
                    splitLevelClassName="overflow-hidden"
                    elementLevelClassName="font-bold"
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                  />
                </motion.span>
              </span>
            </h1>
          </div>
        </motion.div>
      </motion.div>

        {/* Cards layer */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center px-4 md:px-6"
          style={{
            opacity: cardsOpacity,
            y: cardsY,
            filter: cardsFilter,
            pointerEvents: progressValue < 0.9 ? 'none' : 'auto',
          }}
        >
          <div className="w-fit mx-auto">
            <NavigationCardsContent />
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ opacity: scrollHintOpacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <span className="text-sm text-gray-500">Scroll untuk membuka menu</span>
          <motion.div
            className="w-6 h-10 border-2 border-[#6365b9] rounded-full flex justify-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-2 bg-[#6365b9] rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}

// Extract cards content as separate component
function NavigationCardsContent() {
  return (
    <div className="flex flex-col items-center gap-12">
      {/* Section title */}
      <motion.div
        className="text-center overflow-visible"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight pb-1"
          style={{
            background: 'linear-gradient(135deg, #ededed 0%, #6365b9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Find What You Need
        </h2>
      </motion.div>

      {/* Cards grid - mobile stacked, desktop single row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-none xl:grid-flow-col xl:auto-cols-[minmax(200px,1fr)] gap-8 w-full max-w-[1500px] mx-auto place-items-stretch justify-items-center">
        <Card
          title="Employee Handbook"
          link="/employee-handbook"
          imageSrc="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=600&fit=crop"
          index={0}
        />
        <Card
          title="Employee Journey"
          link="/employee-journey"
          imageSrc="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=600&fit=crop"
          index={1}
        />
        <Card
          title="Imajin Assets"
          link="/imajin-assets"
          imageSrc="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=600&fit=crop"
          index={2}
        />
        <Card
          title="Booking Room"
          link="/booking-room"
          imageSrc="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=600&h=600&fit=crop"
          index={3}
        />
      </div>
    </div>
  );
}

interface CardProps {
  title: string;
  link: string;
  imageSrc: string;
  index: number;
}

function Card({ title, link, imageSrc, index }: CardProps) {
  const titleText = title;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="w-full h-full max-w-[360px] sm:max-w-[420px] lg:max-w-[520px] xl:max-w-none xl:min-w-[200px]"
    >
      <a href={link} className="block cursor-target">
        <TiltedCard
          imageSrc={imageSrc}
          altText={title}
          containerHeight="260px"
          containerWidth="100%"
          imageHeight="260px"
          imageWidth="100%"
          rotateAmplitude={12}
          scaleOnHover={1.08}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent={true}
          overlayContent={
            <div className="tilted-card-overlay-content">
              <span className="tilted-card-title leading-tight">
                {titleText}
              </span>
            </div>
          }
        />
      </a>
    </motion.div>
  );
}
