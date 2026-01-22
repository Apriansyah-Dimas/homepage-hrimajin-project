'use client';

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import TiltedCard from './TiltedCard';
import RotatingText from './RotatingText';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type CardData = {
  id: string;
  title: string;
  link: string;
  imageSrc: string;
};

const DEFAULT_CARDS: CardData[] = [
  {
    id: 'handbook',
    title: 'Employee Handbook',
    link: '/employee-handbook',
    imageSrc:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=480&h=480&fit=crop&q=70&auto=format',
  },
  {
    id: 'journey',
    title: 'Employee Journey',
    link: '/employee-journey',
    imageSrc:
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=480&h=480&fit=crop&q=70&auto=format',
  },
  {
    id: 'assets',
    title: 'Imajin Assets',
    link: '/imajin-assets',
    imageSrc:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=480&h=480&fit=crop&q=70&auto=format',
  },
  {
    id: 'booking',
    title: 'Booking Room',
    link: '/booking-room',
    imageSrc:
      'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=480&h=480&fit=crop&q=70&auto=format',
  },
];

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lastTouchY = useRef<number | null>(null);
  const virtualScroll = useMotionValue(0);
  const [progressValue, setProgressValue] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [cards, setCards] = useState<CardData[]>(DEFAULT_CARDS);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('hr_admin') === 'true';
    } catch (error) {
      return false;
    }
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useMotionValueEvent(virtualScroll, 'change', (latest) => {
    setProgressValue(latest);
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchCards = async () => {
      try {
        const response = await fetch('/api/cards', { signal: controller.signal });
        if (!response.ok) throw new Error('Failed to load cards');
        const json = await response.json();
        if (Array.isArray(json.cards) && json.cards.length > 0) {
          setCards(json.cards as CardData[]);
        }
      } catch (error) {
        // ignore fetch errors and keep defaults
      }
    };

    fetchCards();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (isMobile) {
      virtualScroll.set(0);
      return;
    }

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
  }, [virtualScroll, isMobile]);

  useEffect(() => {
    if (isMobile) {
      virtualScroll.set(0);
      return;
    }

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
  }, [virtualScroll, isMobile]);

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

  const cardsWithAddButton = useMemo(() => {
    if (isAuthenticated && isEditMode) {
      return [
        ...cards,
        {
          id: 'add-card',
          title: 'Add new',
          link: '#',
          imageSrc: '',
        },
      ];
    }
    return cards;
  }, [cards, isAuthenticated, isEditMode]);

  const handleSubmitNewCard = async (payload: Omit<CardData, 'id'>) => {
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          link: payload.link,
          imageDataUrl: payload.imageSrc,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Gagal menambah card');
      }

      const created = json.card as CardData;
      setCards((prev) => [...prev, created]);
      setIsAddModalOpen(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to add card', error);
      throw error;
    }
  };

  if (isMobile) {
    return (
      <section
        ref={sectionRef}
        className="relative w-full px-4 py-12 sm:py-16"
      >
        <div className="relative z-10 max-w-5xl w-full mx-auto px-2 sm:px-4 text-left flex justify-center">
          <div className="inline-flex flex-col items-start gap-3">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight flex flex-col gap-2 text-left">
              <span>
                {lineOneWords.map((word, index) => (
                  <span
                    key={index}
                    className="inline-block"
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
                  </span>
                ))}
              </span>
              <span>
                {lineTwoWords.map((word, index) => (
                  <span
                    key={index}
                    className="inline-block"
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
                  </span>
                ))}
                {' '}
                <span className="inline-flex items-center ml-2">
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
                </span>
              </span>
            </h1>
          </div>
        </div>

        <div className="relative z-10 mt-12">
          <NavigationCardsContent
            cards={cardsWithAddButton}
            isAuthenticated={isAuthenticated}
            isEditMode={isEditMode}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        </div>

        <AddCardModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleSubmitNewCard}
        />
      </section>
    );
  }

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
            <NavigationCardsContent
              cards={cardsWithAddButton}
              isAuthenticated={isAuthenticated}
              isEditMode={isEditMode}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
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

      {isAuthenticated && (
        <div className="fixed top-6 right-6 z-40 flex items-center gap-3">
          <div className="rounded-full bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8cd1] border border-white/10">
            Edit Mode
          </div>
          <button
            className={`rounded-full border border-white/10 px-3 py-2 text-sm font-semibold transition ${
              isEditMode
                ? 'bg-[#6365b9] text-white shadow-lg shadow-[#6365b9]/40 hover:bg-[#4a4c91]'
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
            onClick={() => setIsEditMode((prev) => !prev)}
          >
            {isEditMode ? 'On' : 'Off'}
          </button>
        </div>
      )}

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSubmitNewCard}
      />
    </>
  );
}

// Extract cards content as separate component
function NavigationCardsContent({
  cards,
  isAuthenticated,
  isEditMode,
  onOpenAddModal,
}: {
  cards: CardData[];
  isAuthenticated: boolean;
  isEditMode: boolean;
  onOpenAddModal: () => void;
}) {
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
        {cards.map((card, idx) =>
          card.id === 'add-card' ? (
            <AddCardTile
              key={card.id}
              index={idx}
              isVisible={isAuthenticated && isEditMode}
              onClick={onOpenAddModal}
            />
          ) : (
            <Card
              key={card.id}
              title={card.title}
              link={card.link}
              imageSrc={card.imageSrc}
              index={idx}
            />
          ),
        )}
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

function AddCardTile({
  index,
  isVisible,
  onClick,
}: {
  index: number;
  isVisible: boolean;
  onClick: () => void;
}) {
  if (!isVisible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="w-full h-full max-w-[360px] sm:max-w-[420px] lg:max-w-[520px] xl:max-w-none xl:min-w-[200px]"
    >
      <button
        onClick={onClick}
        className="group relative flex h-[260px] w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-white/20 bg-white/5 text-white transition hover:-translate-y-1 hover:border-[#6365b9]/70 hover:bg-[#0f0f1a] focus:outline-none focus:ring-2 focus:ring-[#6365b9]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,101,185,0.08),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(138,140,209,0.08),transparent_40%)]" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6365b9]/20 text-3xl font-bold text-[#8a8cd1] transition group-hover:scale-105 group-hover:bg-[#6365b9]/30">
            +
          </div>
          <span className="text-lg font-semibold">Add new card</span>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Name · Link · Image
          </span>
        </div>
      </button>
    </motion.div>
  );
}

function AddCardModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (card: Omit<CardData, 'id'>) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setLink('');
      setImageFile(null);
      setImagePreview('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !link.trim()) {
      setError('Nama dan link wajib diisi.');
      return;
    }
    if (!imageFile) {
      setError('Upload gambar terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataUrl = await readFileAsDataUrl(imageFile);
      await onSubmit({
        title: title.trim(),
        link: link.trim(),
        imageSrc: dataUrl,
      });
    } catch (_) {
      setError('Gagal menambah card. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c0c12] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-300 transition hover:bg-white/10"
        >
          Close
        </button>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#8a8cd1]">
            New Card
          </p>
          <h3 className="text-2xl font-bold text-white">Tambah Item</h3>
          <p className="text-sm text-gray-400">
            Isi nama, link, dan unggah gambar untuk kartu baru.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-200">Nama item</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0f0f1a] px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent transition focus:border-[#6365b9] focus:ring-[#6365b9]/30"
              placeholder="Contoh: Employee Portal"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-200">Link</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0f0f1a] px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent transition focus:border-[#6365b9] focus:ring-[#6365b9]/30"
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-200">Upload gambar</label>
            <div className="rounded-lg border border-dashed border-white/15 bg-[#0f0f1a] p-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    const preview = URL.createObjectURL(file);
                    setImagePreview(preview);
                  }
                }}
                className="w-full text-sm text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#6365b9] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white file:transition file:hover:bg-[#4a4c91]"
              />
              {imagePreview && (
                <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="h-40 w-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-[#6365b9] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#6365b9]/40 transition hover:-translate-y-0.5 hover:bg-[#4a4c91] focus:outline-none focus:ring-2 focus:ring-[#8a8cd1] focus:ring-offset-2 focus:ring-offset-[#0c0c12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Menyimpan...' : 'Tambah Card'}
          </button>
        </form>
      </div>
    </div>
  );
}
