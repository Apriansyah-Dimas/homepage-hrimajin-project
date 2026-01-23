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
        className="relative w-full min-w-[375px] max-w-[520px] mx-auto px-4 py-12 sm:py-16"
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
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl max-h-[65vh] min-h-[320px] overflow-y-auto overscroll-contain">
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
        </div>

        <AddCardModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingCard(null);
          }}
          onSubmitCreate={handleSubmitNewCard}
          onSubmitEdit={(payload) => (editingCard ? handleUpdateCard(editingCard.id, payload) : handleSubmitNewCard(payload))}
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
        onSubmitCreate={handleSubmitNewCard}
        onSubmitEdit={(payload) => (editingCard ? handleUpdateCard(editingCard.id, payload) : handleSubmitNewCard(payload))}
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
  onSubmitCreate,
  onSubmitEdit,
  initialCard,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCreate: (card: Omit<CardData, 'id'>) => Promise<void>;
  onSubmitEdit: (card: Omit<CardData, 'id'>) => Promise<void>;
  initialCard?: CardData | null;
}) {
  const [mode, setMode] = useState<'create' | 'edit'>(initialCard ? 'edit' : 'create');
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadTone, setUploadTone] = useState<'light' | 'dark' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title: string; link: string; image: string }>({
    title: '',
    link: '',
    image: '',
  });
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    const resetState = () => {
      setMode(initialCard ? 'edit' : 'create');
      setTitle('');
      setLink('');
      setImageFile(null);
      setImagePreview('');
      setUploadTone(null);
      setErrors({ title: '', link: '', image: '' });
      setGeneralError(null);
      setIsSubmitting(false);
    };

    if (!isOpen) {
      resetState();
      return;
    }

    if (initialCard) {
      setMode('edit');
      setTitle(initialCard.title);
      setLink(initialCard.link);
      setImagePreview(initialCard.imageSrc);
      setUploadTone(null);
      setImageFile(null);
      setErrors({ title: '', link: '', image: '' });
      setGeneralError(null);
      setIsSubmitting(false);
      updateUploadTone(initialCard.imageSrc);
    } else {
      resetState();
    }
  }, [isOpen, initialCard]);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const truncateFileName = (name: string) =>
    name.length > 28 ? `${name.slice(0, 25)}...` : name;

  const validateTitle = (value: string) =>
    value.trim() ? '' : 'Nama item wajib diisi.';

  const validateLink = (value: string) => {
    if (!value.trim()) return 'Link wajib diisi.';
    try {
      // eslint-disable-next-line no-new
      new URL(value);
      return '';
    } catch (_) {
      return 'Link tidak valid.';
    }
  };

  const validateImage = () => {
    if (mode === 'create') {
      return imageFile ? '' : 'Upload gambar terlebih dahulu.';
    }
    return imageFile || imagePreview ? '' : 'Upload gambar terlebih dahulu.';
  };

  const updateUploadTone = (dataUrl: string) => {
    if (!dataUrl) {
      setUploadTone(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 100;
      canvas.height = 100;
      ctx?.drawImage(img, 0, 0, 100, 100);
      const imageData = ctx?.getImageData(0, 0, 100, 100);
      if (!imageData) return;
      const data = imageData.data;
      let colorSum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const avg = Math.floor((r * 299 + g * 587 + b * 114) / 1000);
        colorSum += avg;
      }
      const brightness = Math.floor(colorSum / (100 * 100));
      setUploadTone(brightness > 128 ? 'light' : 'dark');
    };
    img.src = dataUrl;
  };

  const handleImageChange = (file?: File) => {
    if (!file) {
      setImageFile(null);
      setImagePreview(mode === 'edit' ? initialCard?.imageSrc ?? '' : '');
      setUploadTone(null);
      setErrors((prev) => ({ ...prev, image: '' }));
      return;
    }
    setImageFile(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    updateUploadTone(preview);
    setErrors((prev) => ({ ...prev, image: '' }));
  };

  const handleModeSwitch = (nextMode: 'create' | 'edit') => {
    if (nextMode === mode) return;
    if (nextMode === 'edit' && !initialCard) return;

    setMode(nextMode);
    setErrors({ title: '', link: '', image: '' });
    setGeneralError(null);
    setImageFile(null);

    if (nextMode === 'edit' && initialCard) {
      setTitle(initialCard.title);
      setLink(initialCard.link);
      setImagePreview(initialCard.imageSrc);
      updateUploadTone(initialCard.imageSrc);
    } else {
      setTitle('');
      setLink('');
      setImagePreview('');
      setUploadTone(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setGeneralError(null);

    const validationResult = {
      title: validateTitle(title),
      link: validateLink(link),
      image: validateImage(),
    };
    setErrors(validationResult);
    const hasError = Object.values(validationResult).some(Boolean);
    if (hasError) return;

    setIsSubmitting(true);
    try {
      const dataUrl =
        imageFile
          ? await readFileAsDataUrl(imageFile)
          : mode === 'edit'
            ? initialCard?.imageSrc || imagePreview
            : imagePreview;

      const handler = mode === 'edit' ? onSubmitEdit : onSubmitCreate;
      await handler({
        title: title.trim(),
        link: link.trim(),
        imageSrc: dataUrl,
      });
    } catch (_) {
      setGeneralError('Gagal menambah card. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const hasImage = Boolean(imageFile || imagePreview);
  const uploadLabel = imageFile?.name
    ? truncateFileName(imageFile.name)
    : hasImage
      ? 'Gambar terunggah'
      : 'Upload Image';

  return (
    <div className="create-card-backdrop">
      <div className="create-card-card">
        <button
          onClick={onClose}
          aria-label="Close"
          className="create-card-close"
          type="button"
        >
          X
        </button>

        <div className="mode-switch">
          <button
            type="button"
            className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('create')}
          >
            Create Card
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'edit' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('edit')}
            disabled={!initialCard}
          >
            Edit Card
          </button>
        </div>

        <div className="card-header">
          <p className="eyebrow">{mode === 'edit' ? 'Edit Card' : 'New Card'}</p>
          <h3>{mode === 'edit' ? 'Edit Item' : 'Tambah Item'}</h3>
          <p className="subtitle">Isi nama, link, dan unggah gambar untuk kartu ini.</p>
        </div>

        <form className="create-card-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="cardName">Nama item</label>
            <input
              id="cardName"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: '' }));
                }
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, title: validateTitle(title) }))}
              className={`text-input ${errors.title ? 'input-error' : ''}`}
              placeholder="Contoh: Employee Portal"
              autoComplete="off"
            />
            <span className={`error-message ${errors.title ? 'visible' : ''}`}>
              {errors.title || 'Nama item wajib diisi.'}
            </span>
          </div>

          <div className="input-group">
            <label htmlFor="cardLink">Link</label>
            <input
              id="cardLink"
              type="url"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                if (errors.link) {
                  setErrors((prev) => ({ ...prev, link: '' }));
                }
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, link: validateLink(link) }))}
              className={`text-input ${errors.link ? 'input-error' : ''}`}
              placeholder="https://example.com"
              autoComplete="off"
            />
            <span className={`error-message ${errors.link ? 'visible' : ''}`}>
              {errors.link || 'Link tidak valid.'}
            </span>
          </div>

          <div className="input-group">
            <label>Upload gambar</label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0])}
              />
              <div className={`upload-area ${hasImage ? 'has-file' : ''}`}>
                <div className="plus-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div
                  className={`upload-text ${
                    uploadTone === 'light' ? 'text-black' : uploadTone === 'dark' ? 'text-white' : ''
                  }`}
                >
                  {uploadLabel}
                </div>
              </div>
            </div>
            <span className={`error-message ${errors.image ? 'visible' : ''}`}>
              {errors.image || 'Upload gambar terlebih dahulu.'}
            </span>
          </div>

          {hasImage && (
            <div className="image-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" />
            </div>
          )}

          {generalError && (
            <div className="general-error">
              {generalError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`submit-btn ${isSubmitting ? 'loading' : ''}`}
          >
            <div className="spinner" />
            <span>{isSubmitting ? 'Menyimpan...' : initialCard ? 'Simpan Perubahan' : 'Tambah Card'}</span>
          </button>
        </form>
      </div>

      <style jsx>{`
        .create-card-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: radial-gradient(circle at 20% 20%, rgba(99, 101, 185, 0.08), transparent 32%),
            radial-gradient(circle at 80% 0%, rgba(138, 140, 209, 0.08), transparent 32%),
            rgba(7, 7, 13, 0.88);
          backdrop-filter: blur(18px);
        }

        .create-card-card {
          --card-bg: rgba(255, 255, 255, 0.04);
          --card-border: rgba(255, 255, 255, 0.08);
          --input-bg: #141414;
          --input-border: #27272a;
          --input-border-hover: #3f3f46;
          --text-muted: #a1a1aa;
          --accent: #6365b9;
          --accent-hover: #7577c4;
          position: relative;
          width: 100%;
          max-width: 460px;
          border-radius: 18px;
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
          padding: 32px 32px 28px;
          overflow: hidden;
        }

        .create-card-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(99, 101, 185, 0.05));
          pointer-events: none;
        }

        .create-card-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: #f5f5f5;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .create-card-close:hover {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .card-header {
          position: relative;
          z-index: 1;
          margin-bottom: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .eyebrow {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8a8cd1;
          font-weight: 700;
        }

        .card-header h3 {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
        }

        .mode-switch {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
          margin-bottom: 10px;
        }

        .mode-btn {
          padding: 12px;
          text-align: center;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          color: var(--text-muted);
          background: transparent;
          border: none;
          transition: all 0.25s ease;
        }

        .mode-btn.active {
          color: #fff;
          background: rgba(99, 101, 185, 0.12);
          box-shadow: inset 0 0 0 1px rgba(99, 101, 185, 0.45);
        }

        .mode-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .create-card-form {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .text-input {
          width: 100%;
          border-radius: 10px;
          border: 1px solid var(--input-border);
          background: var(--input-bg);
          padding: 12px 14px;
          color: #fff;
          font-size: 15px;
          outline: none;
          transition: all 0.2s ease;
        }

        .text-input::placeholder {
          color: #52525b;
        }

        .text-input:hover {
          border-color: var(--input-border-hover);
        }

        .text-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(99, 101, 185, 0.35);
        }

        .input-error {
          border-color: #f87171;
        }

        .input-error:focus {
          box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.2);
        }

        .error-message {
          min-height: 16px;
          font-size: 12px;
          color: #f87171;
          opacity: 0;
          transform: translateY(-4px);
          transition: all 0.18s ease;
        }

        .error-message.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .file-upload-wrapper {
          position: relative;
          width: 100%;
          height: 110px;
        }

        .file-upload-wrapper input[type="file"] {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }

        .upload-area {
          position: relative;
          inset: 0;
          height: 100%;
          border-radius: 10px;
          border: 2px dashed var(--input-border);
          background: rgba(20, 20, 20, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .file-upload-wrapper:hover .upload-area:not(.has-file) {
          border-color: var(--accent);
          background: rgba(99, 101, 185, 0.08);
          transform: translateY(-2px);
        }

        .plus-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 34px;
          height: 34px;
          color: var(--accent);
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.2) rotate(-45deg);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .plus-icon svg {
          width: 100%;
          height: 100%;
          stroke-width: 2;
        }

        .file-upload-wrapper:hover .upload-area:not(.has-file) .plus-icon {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1) rotate(0deg);
        }

        .upload-text {
          position: relative;
          z-index: 1;
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .file-upload-wrapper:hover .upload-area:not(.has-file) .upload-text {
          opacity: 0;
          transform: translateY(14px);
        }

        .upload-area.has-file {
          border-style: solid;
          border-color: var(--accent);
          background: rgba(99, 101, 185, 0.06);
        }

        .upload-area.has-file .upload-text {
          color: #fff;
          opacity: 1;
          transform: none;
        }

        .upload-area.has-file .plus-icon {
          display: none;
        }

        .image-preview {
          width: 100%;
          height: 170px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .general-error {
          border-radius: 10px;
          border: 1px solid rgba(248, 113, 113, 0.4);
          background: rgba(248, 113, 113, 0.08);
          color: #fecdd3;
          padding: 10px 12px;
          font-size: 13px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .submit-btn {
          width: 100%;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #6365b9, #8a8cd1);
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          padding: 12px 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-shadow: 0 10px 25px rgba(99, 101, 185, 0.35);
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--accent-hover), #9a9cd8);
          transform: translateY(-2px);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
          display: none;
        }

        .submit-btn.loading .spinner {
          display: inline-block;
        }

        .submit-btn.loading span {
          opacity: 0.9;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 520px) {
          .create-card-card {
            padding: 28px 22px;
          }
        }
      `}
      </style>
    </div>
  );
}



