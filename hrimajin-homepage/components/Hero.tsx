'use client';

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import TiltedCard from './TiltedCard';
import RotatingText from './RotatingText';
import GradualBlur from './GradualBlur';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type CardData = {
  id: string;
  title: string;
  link: string;
  imageSrc: string;
  directLinkEnabled?: boolean;
  directPath?: string | null;
  hidden?: boolean;
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
    if (isMobile || isAddModalOpen) {
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
  }, [virtualScroll, isMobile, isAddModalOpen]);

  useEffect(() => {
    if (isMobile || isAddModalOpen) {
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
  }, [virtualScroll, isMobile, isAddModalOpen]);

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
    const visibleCards = isEditMode
      ? cards
      : cards.filter((card) => !card.hidden);

    if (isAuthenticated && isEditMode) {
      return [
        ...visibleCards,
        {
          id: 'add-card',
          title: 'Add new',
          link: '#',
          imageSrc: '',
        },
      ];
    }
    return visibleCards;
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
          directLinkEnabled: payload.directLinkEnabled ?? false,
          directPath: payload.directPath ?? null,
          hidden: payload.hidden ?? false,
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
          directLinkEnabled: payload.directLinkEnabled ?? false,
          directPath: payload.directPath ?? null,
          hidden: payload.hidden ?? false,
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
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-visible">
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
          <div className="edit-toggle-button-cover">
            <div className="edit-toggle r">
              <input
                type="checkbox"
                className="edit-toggle-checkbox"
                checked={isEditMode}
                onChange={() => setIsEditMode((prev) => !prev)}
                aria-label="Toggle edit mode"
              />
              <div className="edit-toggle-knobs" />
              <div className="edit-toggle-layer" />
            </div>
          </div>
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

      <style jsx>{`
        .cards-rail-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
          scroll-behavior: smooth;
        }
        .cards-rail-scroll::-webkit-scrollbar {
          display: none;
        }
        .edit-toggle-button-cover {
          position: relative;
          width: 74px;
          height: 36px;
        }
        .edit-toggle,
        .edit-toggle-layer,
        .edit-toggle-knobs {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }
        .edit-toggle {
          margin: 0;
          width: 74px;
          height: 36px;
          border-radius: 100px;
          overflow: hidden;
        }
        .edit-toggle-checkbox {
          position: relative;
          width: 100%;
          height: 100%;
          margin: 0;
          opacity: 0;
          cursor: pointer;
          z-index: 3;
        }
        .edit-toggle-knobs {
          z-index: 2;
        }
        .edit-toggle-layer {
          width: 100%;
          background-color: #222330;
          border: 1px solid #3a3b4a;
          border-radius: 100px;
          transition: 0.3s ease all;
          z-index: 1;
        }
        .edit-toggle.r .edit-toggle-layer {
          border-radius: 100px;
        }
        .edit-toggle.r .edit-toggle-knobs::before {
          content: 'OFF';
          position: absolute;
          top: 5px;
          left: 5px;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          background-color: #454555;
          border-radius: 50%;
          transition: 0.25s ease all, left 0.25s cubic-bezier(0.18, 0.89, 0.35, 1.15);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
        }
        .edit-toggle-checkbox:checked + .edit-toggle-knobs::before {
          content: 'ON';
          left: 43px;
          background-color: #6365b9;
          box-shadow: 0 8px 16px rgba(99, 101, 185, 0.35);
        }
        .edit-toggle-checkbox:checked ~ .edit-toggle-layer {
          background-color: #26283a;
          border-color: #6365b9;
        }
        .edit-toggle-checkbox:focus-visible + .edit-toggle-knobs::before {
          outline: 2px solid #ffffff66;
          outline-offset: 3px;
        }
      `}</style>
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
  const desktopRailRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const DESKTOP_CARD_WIDTH = 240;
  const DESKTOP_CARD_GAP = 32;
  const DESKTOP_PEEK_WIDTH = 120;
  const fullyVisibleCount = Math.min(cards.length, 4);
  const hasDesktopOverflow = cards.length > 4;
  const desktopViewportMaxWidth =
    fullyVisibleCount * DESKTOP_CARD_WIDTH +
    Math.max(fullyVisibleCount - 1, 0) * DESKTOP_CARD_GAP +
    (hasDesktopOverflow ? DESKTOP_PEEK_WIDTH : 0);

  const updateDesktopScrollState = () => {
    const el = desktopRailRef.current;
    if (!el) return;
    const maxScroll = Math.max(el.scrollWidth - el.clientWidth, 0);
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < maxScroll - 2);
  };

  useEffect(() => {
    updateDesktopScrollState();
    const onResize = () => updateDesktopScrollState();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [cards.length]);

  const handleDesktopWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;

    event.preventDefault();
    event.stopPropagation();

    el.scrollBy({
      left: event.deltaY * 1.15,
      behavior: 'auto',
    });
  };

  const scrollDesktopRailBy = (direction: 'left' | 'right') => {
    const el = desktopRailRef.current;
    if (!el) return;

    const step = DESKTOP_CARD_WIDTH + DESKTOP_CARD_GAP;
    el.scrollBy({
      left: direction === 'right' ? step : -step,
      behavior: 'smooth',
    });
  };

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

      {/* Desktop: horizontal rail (4 visible + blurred peek), Mobile/Tablet: regular grid */}
      <div className="w-full max-w-[1500px] mx-auto">
        <div
          className="relative mx-auto max-w-full xl:max-w-[var(--cards-rail-max-width)]"
          style={
            {
              '--cards-rail-max-width':
                desktopViewportMaxWidth > 0 ? `${desktopViewportMaxWidth}px` : '100%',
            } as CSSProperties
          }
        >
          <button
            type="button"
            aria-label="Scroll cards left"
            onClick={() => scrollDesktopRailBy('left')}
            disabled={!canScrollLeft}
            className={`absolute left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md transition xl:flex ${
              canScrollLeft
                ? 'opacity-100 hover:bg-black/60 hover:border-white/25'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <span className="text-lg leading-none">‹</span>
          </button>

          <button
            type="button"
            aria-label="Scroll cards right"
            onClick={() => scrollDesktopRailBy('right')}
            disabled={!canScrollRight}
            className={`absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md transition xl:flex ${
              canScrollRight
                ? 'opacity-100 hover:bg-black/60 hover:border-white/25'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <span className="text-lg leading-none">›</span>
          </button>

          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-10 hidden xl:block w-28 transition-opacity duration-200 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: '10rem',
              WebkitMaskImage: 'linear-gradient(to right, black 0%, black 45%, transparent 100%)',
              maskImage: 'linear-gradient(to right, black 0%, black 45%, transparent 100%)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/58 via-[#0a0a0a]/22 to-transparent" />
            <GradualBlur
              target="parent"
              position="left"
              height="10rem"
              strength={1.35}
              divCount={12}
              curve="bezier"
              exponential
              opacity={0.9}
            />
          </div>

          <div
            className={`pointer-events-none absolute inset-y-0 right-0 z-10 hidden xl:block w-32 transition-opacity duration-200 ${
              canScrollRight ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: '10rem',
              WebkitMaskImage: 'linear-gradient(to left, black 0%, black 45%, transparent 100%)',
              maskImage: 'linear-gradient(to left, black 0%, black 45%, transparent 100%)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0a]/58 via-[#0a0a0a]/22 to-transparent" />
            <GradualBlur
              target="parent"
              position="right"
              height="10rem"
              strength={1.35}
              divCount={12}
              curve="bezier"
              exponential
              opacity={0.9}
            />
          </div>

          <div
            ref={desktopRailRef}
            className="cards-rail-scroll overflow-x-visible xl:overflow-x-auto overflow-y-visible xl:snap-x xl:snap-mandatory"
            onWheel={handleDesktopWheel}
            onScroll={updateDesktopScrollState}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-none xl:grid-flow-col xl:auto-cols-[240px] gap-8 w-full xl:w-max mx-auto place-items-stretch justify-items-center py-4 xl:py-6 xl:px-3 xl:pr-7">
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
        </div>
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
      className="relative z-0 w-full h-full max-w-[360px] sm:max-w-[420px] lg:max-w-[520px] xl:w-[240px] xl:min-w-[240px] xl:max-w-[240px] xl:snap-start hover:z-30"
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
          <div className="w-full aspect-[3/4]">
            <TiltedCard
              imageSrc={imageSrc}
              altText={title}
              containerHeight="100%"
              containerWidth="100%"
              imageHeight="100%"
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
          </div>
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
      className="relative z-0 w-full h-full max-w-[360px] sm:max-w-[420px] lg:max-w-[520px] xl:w-[240px] xl:min-w-[240px] xl:max-w-[240px] xl:snap-start hover:z-30"
      >
            <button
        onClick={onClick}
        className="group relative flex aspect-[3/4] h-auto w-full items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-white/5 text-white shadow-[0_14px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#6365b9]/70 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#6365b9]/60"
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
  const mode: 'create' | 'edit' = initialCard ? 'edit' : 'create';
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [directLinkEnabled, setDirectLinkEnabled] = useState(false);
  const [directPath, setDirectPath] = useState('');
  const [pathStatus, setPathStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'invalid'>('idle');
  const [hidden, setHidden] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadTone, setUploadTone] = useState<'light' | 'dark' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title: string; link: string; image: string; directPath: string }>({
    title: '',
    link: '',
    image: '',
    directPath: '',
  });

  useEffect(() => {
    const resetState = () => {
      setTitle(initialCard?.title ?? '');
      setLink(initialCard?.link ?? '');
      setDirectLinkEnabled(Boolean(initialCard?.directLinkEnabled));
      setDirectPath(initialCard?.directPath ?? '');
      setPathStatus('idle');
      setHidden(Boolean(initialCard?.hidden));
      setImageFile(null);
      setImagePreview(initialCard?.imageSrc ?? '');
      setUploadTone(null);
      setErrors({ title: '', link: '', image: '', directPath: '' });
      setIsSubmitting(false);
    };

    if (!isOpen) {
      resetState();
      return;
    }

    resetState();
    if (initialCard?.imageSrc) {
      updateUploadTone(initialCard.imageSrc);
    }
  }, [isOpen, initialCard]);

  useEffect(() => {
    if (!directLinkEnabled) {
      setErrors((prev) => ({ ...prev, directPath: '' }));
      setPathStatus('idle');
      return;
    }

    const slug = sanitizeDirectPath(directPath);
    const immediateError = validateDirectPath(slug, true);
    if (immediateError) {
      setErrors((prev) => ({ ...prev, directPath: immediateError }));
      setPathStatus(immediateError.includes('reserve') ? 'reserved' : 'invalid');
      return;
    }

    setErrors((prev) => ({ ...prev, directPath: '' }));
    setPathStatus('checking');

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = `/api/direct-path/check?path=${encodeURIComponent(slug)}${initialCard?.id ? `&id=${initialCard.id}` : ''}`;
        const res = await fetch(url, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) {
          setPathStatus('invalid');
          setErrors((prev) => ({ ...prev, directPath: json.error || 'Path tidak valid.' }));
          return;
        }
        if (json.available) {
          setPathStatus('available');
          setErrors((prev) => ({ ...prev, directPath: '' }));
        } else {
          const reason = json.reason as string | undefined;
          setPathStatus(reason === 'reserved' ? 'reserved' : 'taken');
          setErrors((prev) => ({
            ...prev,
            directPath:
              reason === 'reserved'
                ? 'Path ini ter-reserve sistem.'
                : 'Path sudah dipakai.',
          }));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setPathStatus('invalid');
        setErrors((prev) => ({ ...prev, directPath: 'Gagal mengecek path.' }));
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [directPath, directLinkEnabled, initialCard?.id]);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const truncateFileName = (name: string) =>
    name.length > 20 ? `${name.slice(0, 17)}...` : name;

  const RESERVED_PATHS = [
    'login',
    'logout',
    'dashboard',
    'api',
    'assets',
    'admin',
    'static',
    'favicon.ico',
    '_next',
    'vercel',
    'robots.txt',
    'sitemap.xml',
  ];

  const sanitizeDirectPath = (value: string) =>
    value.trim().replace(/^\/+/, '');

  const validateDirectPath = (value: string, enabled: boolean) => {
    if (!enabled) return '';
    const slug = sanitizeDirectPath(value);
    if (!slug) return 'Path wajib diisi.';
    if (!/^[A-Za-z0-9_-]{2,60}$/.test(slug)) {
      return 'Gunakan huruf/angka, - atau _, 2-60 karakter.';
    }
    if (RESERVED_PATHS.includes(slug.toLowerCase())) {
      return 'Path ini ter-reserve sistem.';
    }
    return '';
  };

  const validateTitle = (value: string) =>
    value.trim() ? '' : 'Card name is required.';

  const validateLink = (value: string) => {
    if (!value.trim()) return 'Please enter a valid URL.';
    try {
      // eslint-disable-next-line no-new
      new URL(value);
      return '';
    } catch (_) {
      return 'Please enter a valid URL.';
    }
  };

  const validateImage = () =>
    imageFile || imagePreview ? '' : 'Please select an image.';

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

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setUploadTone(null);
    setErrors((prev) => ({ ...prev, image: '' }));
  };

  const handleCancel = () => {
    setImageFile(null);
    setImagePreview(initialCard?.imageSrc ?? '');
    setUploadTone(null);
    setDirectLinkEnabled(Boolean(initialCard?.directLinkEnabled));
    setDirectPath(initialCard?.directPath ?? '');
    setHidden(Boolean(initialCard?.hidden));
    setPathStatus('idle');
    setErrors({ title: '', link: '', image: '', directPath: '' });
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const normalizedPath = sanitizeDirectPath(directPath);
    const validationResult = {
      title: validateTitle(title),
      link: validateLink(link),
      image: validateImage(),
      directPath: validateDirectPath(normalizedPath, directLinkEnabled),
    };
    setErrors(validationResult);
    const hasError = Object.values(validationResult).some(Boolean)
      || (directLinkEnabled && pathStatus !== 'available' && pathStatus !== 'idle');
    if (hasError) return;

    setIsSubmitting(true);
    try {
      const dataUrl =
        imageFile
          ? await readFileAsDataUrl(imageFile)
          : initialCard?.imageSrc || imagePreview;

      const handler = mode === 'edit' ? onSubmitEdit : onSubmitCreate;
      await handler({
        title: title.trim(),
        link: link.trim(),
        imageSrc: dataUrl,
        directLinkEnabled,
        directPath: directLinkEnabled ? normalizedPath : undefined,
        hidden,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const hasImage = Boolean(imageFile || imagePreview);
  const uploadLabel = imageFile?.name
    ? truncateFileName(imageFile.name)
    : hasImage
      ? 'Image Uploaded'
      : 'Upload Image';
  const uploadToneClass = uploadTone === 'light' ? 'text-black' : uploadTone === 'dark' ? 'text-white' : '';

  return (
    <div className="create-card-backdrop">
      <div className="login-wrapper">
        <main className="card">
          <button
            type="button"
            aria-label="Close"
            className="close-btn"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            ×
          </button>
          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="cardName">Card Name</label>
              <input
                id="cardName"
                type="text"
                placeholder="e.g. My Project"
                value={title}
                autoComplete="off"
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                onBlur={() => setErrors((prev) => ({ ...prev, title: validateTitle(title) }))}
                className={errors.title ? 'input-error' : ''}
                disabled={isSubmitting}
              />
              <span className={`error-message ${errors.title ? 'visible' : ''}`}>
                {errors.title || 'Card name is required.'}
              </span>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label htmlFor="cardLink">Link</label>
                <div className="toggle-wrapper">
                  <span>Direct Link</span>
                  <div className="toggle-switch">
                    <input
                      className="toggle-input"
                      id="directLinkToggle"
                      type="checkbox"
                      checked={directLinkEnabled}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setDirectLinkEnabled(next);
                        if (!next) {
                          setDirectPath('');
                          setPathStatus('idle');
                          setErrors((prev) => ({ ...prev, directPath: '' }));
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <label className="toggle-label" htmlFor="directLinkToggle" />
                  </div>
                </div>
              </div>
              <input
                id="cardLink"
                type="url"
                placeholder={directLinkEnabled ? 'https://target-url-panjang.com/...' : 'https://example.com'}
                value={link}
                autoComplete="off"
                onChange={(e) => {
                  setLink(e.target.value);
                  if (errors.link) setErrors((prev) => ({ ...prev, link: '' }));
                }}
                onBlur={() => setErrors((prev) => ({ ...prev, link: validateLink(link) }))}
                className={errors.link ? 'input-error' : ''}
                disabled={isSubmitting}
              />
              <span className="helper-text">
                {directLinkEnabled
                  ? 'Target URL.'
                  : 'Link biasa akan dibuka langsung.'}
              </span>
              <span className={`error-message ${errors.link ? 'visible' : ''}`}>
                {errors.link || 'Please enter a valid URL.'}
              </span>
            </div>

            {directLinkEnabled && (
              <div className="input-group">
                <label htmlFor="directPath">Short Path</label>
                <input
                  id="directPath"
                  type="text"
                  placeholder="spreadsheet"
                  value={directPath}
                  autoComplete="off"
                  onChange={(e) => {
                    const raw = e.target.value;
                    const sanitized = sanitizeDirectPath(raw.replace(/^\/+/, ''));
                    setDirectPath(sanitized);
                    if (errors.directPath) setErrors((prev) => ({ ...prev, directPath: '' }));
                  }}
                onBlur={() => {
                    const normalized = sanitizeDirectPath(directPath);
                    setDirectPath(normalized);
                    setErrors((prev) => ({
                      ...prev,
                      directPath: validateDirectPath(normalized, true),
                    }));
                  }}
                  className={errors.directPath ? 'input-error' : ''}
                  disabled={isSubmitting}
                />
                <div className="helper-row">
                  <span className="helper-text">
                    Hanya huruf kecil, angka, -, _ (2-60). Tanpa spasi.
                  </span>
                  <span className="status">
                    {pathStatus === 'checking' && 'Checking...'}
                    {pathStatus === 'available' && 'Available'}
                    {pathStatus === 'taken' && 'Already used'}
                    {pathStatus === 'reserved' && 'Reserved'}
                  </span>
                </div>
                <div className="preview-url">
                  https://hrimajin.id/{sanitizeDirectPath(directPath) || 'your-path'}
                </div>
                <span className={`error-message ${errors.directPath ? 'visible' : ''}`}>
                  {errors.directPath || 'Path wajib diisi saat Direct Link aktif.'}
                </span>
              </div>
            )}

            <div className="input-group">
              <div className="label-row">
                <label>Visibility</label>
                <div className="toggle-wrapper">
                  <span>Hide card</span>
                  <div className="toggle-switch">
                    <input
                      className="toggle-input"
                      id="hideCardToggle"
                      type="checkbox"
                      checked={hidden}
                      onChange={(e) => setHidden(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <label className="toggle-label" htmlFor="hideCardToggle" />
                  </div>
                </div>
              </div>
              <span className="helper-text" />
            </div>

            <div className="input-group">
              <label>Image</label>
              <div className="file-upload-wrapper">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                  disabled={isSubmitting}
                />
                <div
                  className={`upload-area ${hasImage ? 'has-file' : ''}`}
                  style={{
                    backgroundImage: hasImage ? `url(${imagePreview})` : 'none',
                  }}
                >
                  {hasImage && (
                    <button
                      type="button"
                      className="remove-image"
                      aria-label="Remove image"
                      onClick={handleRemoveImage}
                      disabled={isSubmitting}
                    >
                      ×
                    </button>
                  )}
                  <div className="plus-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <div className={`upload-text ${uploadToneClass}`}>
                    {uploadLabel}
                  </div>
                </div>
              </div>
              <span className={`error-message ${errors.image ? 'visible' : ''}`}>
                {errors.image || 'Please select an image.'}
              </span>
            </div>

            <div className="actions">
              <button
                type="submit"
                id="submitBtn"
                className={isSubmitting ? 'loading' : ''}
                disabled={isSubmitting}
              >
                <div className="spinner" />
                <span>{isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Card'}</span>
              </button>
              <button
                type="button"
                className="btn-cancel"
                id="cancelBtn"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </main>
      </div>

      <style jsx>{`
        :global(:root) {
          --bg-color: #0a0a0a;
          --card-bg: #111119;
          --card-border: #1f1f29;
          --accent-primary: #6365b9;
          --accent-hover: #7577c4;
          --accent-focus-ring: rgba(99, 101, 185, 0.4);
          --text-main: #ffffff;
          --text-muted: #a1a1aa;
          --text-error: #f87171;
          --input-bg: #141414;
          --input-border: #27272a;
          --input-border-hover: #3f3f46;
          --radius-card: 16px;
          --radius-input: 8px;
          --shadow-card: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
        }

        .create-card-backdrop {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 50;
          padding: 20px;
        }

        .login-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .card {
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-card);
          padding: 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 24px;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          padding: 4px 6px;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .close-btn:hover:not(:disabled) {
          color: #fff;
          transform: scale(1.05);
        }

        .close-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }

        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          margin-left: 2px;
        }

        .toggle-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--text-muted);
          user-select: none;
        }

        .toggle-switch {
          position: relative;
          width: 52px;
          height: 28px;
          flex-shrink: 0;
        }

        .toggle-input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }

        .toggle-label {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #3a3a46;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          border-radius: 999px;
          box-shadow: inset 0 0 0 1px #4b4b55;
        }

        .toggle-label:before {
          position: absolute;
          content: '';
          height: 22px;
          width: 22px;
          left: 3px;
          top: 3px;
          background-color: #fff;
          border-radius: 50%;
          transition: transform 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .toggle-input:checked + .toggle-label {
          background-color: #6365b9;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .toggle-input:checked + .toggle-label:before {
          transform: translateX(24px);
        }

        .toggle-input:focus-visible + .toggle-label {
          outline: 2px solid #6365b9;
          outline-offset: 3px;
        }

        .toggle-input:disabled + .toggle-label {
          cursor: not-allowed;
          opacity: 0.5;
        }

        input[type="text"],
        input[type="url"] {
          width: 100%;
          background-color: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-input);
          padding: 12px 14px;
          font-size: 15px;
          color: var(--text-main);
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
        }

        input::placeholder {
          color: #52525b;
        }

        input:hover {
          border-color: var(--input-border-hover);
        }

        input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-focus-ring);
        }

        input.input-error {
          border-color: var(--text-error);
        }
        input.input-error:focus {
          box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.2);
        }

        .error-message {
          font-size: 12px;
          color: var(--text-error);
          min-height: 0;
          height: 0;
          opacity: 0;
          transform: translateY(-5px);
          transition: all 0.2s ease;
          margin-left: 2px;
          overflow: hidden;
        }

        .helper-text {
          font-size: 12px;
          color: var(--text-muted);
          margin-left: 2px;
        }

        .helper-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .status {
          font-size: 12px;
          color: #a5f3fc;
        }

        .preview-url {
          font-size: 13px;
          color: #e5e7eb;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed var(--input-border);
          border-radius: var(--radius-input);
          padding: 10px 12px;
          word-break: break-all;
        }

        .error-message.visible {
          height: auto;
          min-height: 18px;
          opacity: 1;
          transform: translateY(0);
        }

        .file-upload-wrapper {
          position: relative;
          width: 100%;
          height: 100px;
        }

        .file-upload-wrapper input[type="file"] {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 10;
        }

        .upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: rgba(20, 20, 20, 0.4);
          border: 2px dashed var(--input-border);
          border-radius: var(--radius-input);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          text-align: center;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .file-upload-wrapper:hover .upload-area:not(.has-file) {
          border-color: var(--accent-primary);
          background: rgba(99, 101, 185, 0.08);
          transform: translateY(-2px);
        }

        .plus-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.2) rotate(-45deg);
          color: var(--accent-primary);
          opacity: 0;
          width: 32px;
          height: 32px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 2;
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
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          position: relative;
          z-index: 2;
          padding: 4px 8px;
          border-radius: 4px;
          color: var(--text-muted);
        }

        .file-upload-wrapper:hover .upload-area:not(.has-file) .upload-text {
          opacity: 0;
          transform: translateY(15px);
        }

        .upload-area.has-file {
          border-style: solid;
          border-color: var(--accent-primary);
        }

        .remove-image {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(0, 0, 0, 0.45);
          color: #fff;
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
          display: grid;
          place-items: center;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.25s ease;
          cursor: pointer;
          z-index: 3;
        }

        .upload-area.has-file:hover .remove-image {
          opacity: 1;
          transform: scale(1);
        }

        .remove-image:hover:not(:disabled) {
          border-color: rgba(255, 255, 255, 0.32);
          background: rgba(0, 0, 0, 0.65);
        }

        .remove-image:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .upload-area.has-file .plus-icon {
          display: none;
        }

        .text-white {
          color: #ffffff !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .text-black {
          color: #000000 !important;
          text-shadow: 0 1px 3px rgba(255, 255, 255, 0.6);
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        button {
          flex: 1;
          padding: 12px;
          border-radius: var(--radius-input);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        button[type="submit"] {
          background-color: var(--accent-primary);
          color: white;
          border: none;
        }

        button[type="submit"]:hover:not(:disabled) {
          background-color: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 101, 185, 0.3);
        }

        button.btn-cancel {
          background-color: transparent;
          color: var(--text-muted);
          border: 1px solid var(--input-border);
        }

        button.btn-cancel:hover:not(:disabled) {
          border-color: var(--text-error);
          color: var(--text-error);
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
          display: none;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        button.loading .spinner {
          display: inline-block;
        }
        button.loading span {
          opacity: 0.8;
        }
      `}
      </style>
    </div>
  );
}














