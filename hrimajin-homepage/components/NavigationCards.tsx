'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import ScrollWrapper from './ScrollWrapper';
import Image from 'next/image';

interface CardProps {
  title: string;
  description: string;
  link: string;
  imageSrc: string;
  delay: number;
}

function Card({ title, description, link, imageSrc, delay }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <ScrollWrapper delay={delay} className="w-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative group cursor-pointer"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {/* Card container */}
        <motion.a
          href={link}
          className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border border-[#6365b9]/20 hover:border-[#6365b9]/50 transition-all duration-300"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Glare effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 101, 185, 0.15), transparent 50%)',
            }}
          />

          {/* Hover image overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${imageSrc})` }}
            >
              <div className="w-full h-full bg-gradient-to-br from-[#6365b9]/20 to-transparent" />
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6 sm:p-8 z-20">
            <motion.div
              className="w-12 h-12 rounded-xl bg-[#6365b9]/20 flex items-center justify-center mb-4 group-hover:bg-[#6365b9]/40 transition-colors duration-300"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <svg
                className="w-6 h-6 text-[#6365b9]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </motion.div>

            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white group-hover:text-[#8a8cd1] transition-colors duration-300">
              {title}
            </h3>

            <p className="text-gray-400 text-sm sm:text-base mb-4 line-clamp-2">
              {description}
            </p>

            <motion.div
              className="flex items-center gap-2 text-[#6365b9] group-hover:text-[#8a8cd1] transition-colors duration-300"
              whileHover={{ x: 5 }}
            >
              <span className="text-sm font-medium">Explore</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </motion.div>
          </div>

          {/* Animated border glow */}
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(99, 101, 185, 0.3) 50%, transparent 70%)',
              backgroundSize: '200% 200%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.a>
      </motion.div>
    </ScrollWrapper>
  );
}

export default function NavigationCards() {
  const cards = [
    {
      title: 'Tentang Kami',
      description: 'Kenali lebih dekat siapa kami dan apa yang kami lakukan untuk membantu Anda.',
      link: '/about',
      imageSrc: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop',
    },
    {
      title: 'Layanan',
      description: 'Temukan berbagai layanan berkualitas yang kami tawarkan untuk kebutuhan Anda.',
      link: '/services',
      imageSrc: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop',
    },
    {
      title: 'Portfolio',
      description: 'Lihat karya-karya terbaik kami dan proyek yang telah kami selesaikan.',
      link: '/portfolio',
      imageSrc: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    },
    {
      title: 'Kontak',
      description: 'Hubungi kami sekarang untuk konsultasi gratis dan penawaran terbaik.',
      link: '/contact',
      imageSrc: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=600&h=400&fit=crop',
    },
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        {/* Section title with animation */}
        <ScrollWrapper className="text-center mb-16">
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight pb-1 overflow-visible"
          style={{
            background: 'linear-gradient(135deg, #ededed 0%, #6365b9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Find What You Need
        </motion.h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Pilih salah satu menu di bawah ini untuk memulai perjalanan Anda bersama kami
          </p>
        </ScrollWrapper>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-10">
          {cards.map((card, index) => (
            <Card
              key={card.title}
              {...card}
              delay={index * 0.15}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
