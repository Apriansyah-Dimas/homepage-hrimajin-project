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

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lastTouchY = useRef<number | null>(null);
  const virtualScroll = useMotionValue(0);
  const [progressValue, setProgressValue] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [cards, setCards] = useState<CardData[]>([]);
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
  const [editingCard, setEditingCard] = useState<CardData | null>(null);

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

  const handleUpdateCard = async (cardId: string, payload: Omit<CardData, 'id'>) => {
    try {
      const response = await fetch('/api/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cardId,
          title: payload.title,
          link: payload.link,
          imageDataUrl: payload.imageSrc,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Gagal mengubah card');
      }

      const updated = json.card as CardData;
      setCards((prev) => prev.map((item) => (item.id === cardId ? updated : item)));
      setEditingCard(null);
      setIsAddModalOpen(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update card', error);
      throw error;
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await fetch('/api/cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cardId }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Gagal menghapus card');
      }

      setCards((prev) => prev.filter((item) => item.id !== cardId));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete card', error);
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
            onEditCard={(card) => {
              setEditingCard(card);
              setIsAddModalOpen(true);
            }}
            onOpenAddModal={() => {
              setEditingCard(null);
              setIsAddModalOpen(true);
            }}
            onDeleteCard={(card) => handleDeleteCard(card.id)}
          />
        </div>

        <AddCardModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingCard(null);
          }}
          onSubmit={
            editingCard
              ? (payload) => handleUpdateCard(editingCard.id, payload)
              : handleSubmitNewCard
          }
          initialCard={editingCard}
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
            onEditCard={(card) => {
              setEditingCard(card);
              setIsAddModalOpen(true);
            }}
            onOpenAddModal={() => {
              setEditingCard(null);
              setIsAddModalOpen(true);
            }}
            onDeleteCard={(card) => handleDeleteCard(card.id)}
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
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCard(null);
        }}
        onSubmit={
          editingCard
            ? (payload) => handleUpdateCard(editingCard.id, payload)
            : handleSubmitNewCard
        }
        initialCard={editingCard}
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
  onEditCard,
  onDeleteCard,
}: {
  cards: CardData[];
  isAuthenticated: boolean;
  isEditMode: boolean;
  onOpenAddModal: () => void;
  onEditCard: (card: CardData) => void;
  onDeleteCard: (card: CardData) => void;
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
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card)}
              isEditable={isAuthenticated && isEditMode}
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
  onEdit?: () => void;
  onDelete?: () => void;
  isEditable?: boolean;
}

function Card({ title, link, imageSrc, index, onEdit, onDelete, isEditable }: CardProps) {
  const titleText = title;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="w-full h-full max-w-[360px] sm:max-w-[420px] lg:max-w-[520px] xl:max-w-none xl:min-w-[200px]"
    >
      <div className="relative">
        {isEditable && onEdit && (
          <div className="absolute right-3 top-3 z-20 flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:border-white/30 hover:bg-white/15"
            >
              Edit
            </button>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded-full border border-red-400/60 bg-red-500/80 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-red-500"
              >
                Delete
              </button>
            )}
          </div>
        )}
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
      </div>
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
        className="group relative flex h-[260px] w-full items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-white/5 text-white shadow-[0_14px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#6365b9]/70 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#6365b9]/60"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,101,185,0.12),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(138,140,209,0.12),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(99,101,185,0.08))]" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#6365b9]/20 text-3xl font-bold text-[#8a8cd1] shadow-inner shadow-black/20 transition group-hover:scale-105 group-hover:bg-[#6365b9]/30">
            +
          </div>
          <span className="text-lg font-semibold">Add new card</span>
          <span className="text-xs uppercase tracking-[0.2em] text-white/60">
            Name / Link / Image
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
  initialCard,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (card: Omit<CardData, 'id'>) => Promise<void>;
  initialCard?: CardData | null;
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
      return;
    }

    if (initialCard) {
      setTitle(initialCard.title);
      setLink(initialCard.link);
      setImagePreview(initialCard.imageSrc);
      setImageFile(null);
      setError(null);
      setIsSubmitting(false);
    } else {
      setTitle('');
      setLink('');
      setImageFile(null);
      setImagePreview('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialCard]);

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
    if (!imageFile && !initialCard) {
      setError('Upload gambar terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataUrl =
        imageFile ? await readFileAsDataUrl(imageFile) : initialCard?.imageSrc || '';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#07070d]/85 via-[#0a0a10]/80 to-[#0c0c14]/85 backdrop-blur-xl p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,101,185,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(138,140,209,0.12),transparent_32%)]" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-base font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
        >
          X
        </button>
        <div className="relative z-10 mb-6 space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8a8cd1]">
            {initialCard ? 'Edit Card' : 'New Card'}
          </p>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {initialCard ? 'Edit Item' : 'Tambah Item'}
          </h3>
          <p className="text-sm text-white/70">
            Isi nama, link, dan unggah gambar untuk kartu ini.
          </p>
        </div>

        <form className="relative z-10 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/80">Nama item</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none ring-2 ring-transparent transition focus:border-[#6365b9] focus:ring-[#6365b9]/35 placeholder:text-white/40"
              placeholder="Contoh: Employee Portal"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/80">Link</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none ring-2 ring-transparent transition focus:border-[#6365b9] focus:ring-[#6365b9]/35 placeholder:text-white/40"
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/80">Upload gambar</label>
            <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4">
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
                className="w-full text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-[#6365b9] file:px-3.5 file:py-2.5 file:text-sm file:font-semibold file:text-white file:transition file:hover:bg-[#4a4c91]"
              />
              {imagePreview && (
                <div className="mt-3 overflow-hidden rounded-lg border border-white/10 shadow-inner shadow-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="h-40 w-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 shadow-inner shadow-red-900/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#6365b9] via-[#6f71c0] to-[#8a8cd1] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6365b9]/35 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(99,101,185,0.45)] focus:outline-none focus:ring-2 focus:ring-[#8a8cd1] focus:ring-offset-2 focus:ring-offset-[#0b0b11] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Menyimpan...' : 'Tambah Card'}
          </button>
        </form>
      </div>
    </div>
  );
}



