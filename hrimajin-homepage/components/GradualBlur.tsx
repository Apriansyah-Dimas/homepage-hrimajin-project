'use client';

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as math from 'mathjs';

type BlurPosition = 'top' | 'bottom' | 'left' | 'right';
type BlurCurve = 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out';
type BlurTarget = 'parent' | 'page';

type GradualBlurProps = {
  position?: BlurPosition;
  strength?: number;
  height?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  opacity?: number;
  curve?: BlurCurve;
  target?: BlurTarget;
  className?: string;
  style?: React.CSSProperties;
};

const CURVE_FUNCTIONS: Record<BlurCurve, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  'ease-in': (p) => p * p,
  'ease-out': (p) => 1 - Math.pow(1 - p, 2),
  'ease-in-out': (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const getGradientDirection = (position: BlurPosition) =>
  (
    {
      top: 'to top',
      bottom: 'to bottom',
      left: 'to left',
      right: 'to right',
    } as const
  )[position];

function GradualBlur({
  position = 'bottom',
  strength = 2,
  height = '6rem',
  divCount = 5,
  exponential = false,
  zIndex = 1000,
  opacity = 1,
  curve = 'linear',
  target = 'parent',
  className = '',
  style = {},
}: GradualBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
  }, []);

  const blurDivs = useMemo(() => {
    const divs: React.ReactNode[] = [];
    const increment = 100 / divCount;
    const curveFn = CURVE_FUNCTIONS[curve] ?? CURVE_FUNCTIONS.linear;
    const direction = getGradientDirection(position);

    for (let i = 1; i <= divCount; i += 1) {
      let progress = i / divCount;
      progress = curveFn(progress);

      const blurValue = exponential
        ? (math.pow(2, progress * 4) as number) * 0.0625 * strength
        : 0.0625 * (progress * divCount + 1) * strength;

      const p1 = (math.round((increment * i - increment) * 10) as number) / 10;
      const p2 = (math.round(increment * i * 10) as number) / 10;
      const p3 = (math.round((increment * i + increment) * 10) as number) / 10;
      const p4 = (math.round((increment * i + increment * 2) * 10) as number) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      divs.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            maskImage: `linear-gradient(${direction}, ${gradient})`,
            WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
            backdropFilter: `blur(${Number(blurValue).toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${Number(blurValue).toFixed(3)}rem)`,
            opacity,
          }}
        />,
      );
    }

    return divs;
  }, [curve, divCount, exponential, opacity, position, strength]);

  const containerStyle = useMemo<React.CSSProperties>(() => {
    const isVertical = position === 'top' || position === 'bottom';
    const isPageTarget = target === 'page';
    const base: React.CSSProperties = {
      position: isPageTarget ? 'fixed' : 'absolute',
      pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      zIndex,
      ...style,
    };

    if (isVertical) {
      base.height = height;
      base.width = '100%';
      base.left = 0;
      base.right = 0;
      base[position] = 0;
    } else {
      base.width = height;
      base.height = '100%';
      base.top = 0;
      base.bottom = 0;
      base[position] = 0;
    }

    return base;
  }, [height, position, style, target, visible, zIndex]);

  return (
    <div
      ref={containerRef}
      className={`gradual-blur ${target === 'page' ? 'gradual-blur-page' : 'gradual-blur-parent'} ${className}`}
      style={containerStyle}
    >
      <div className="gradual-blur-inner" style={{ position: 'relative', width: '100%', height: '100%' }}>
        {blurDivs}
      </div>
    </div>
  );
}

const GradualBlurMemo = memo(GradualBlur);
GradualBlurMemo.displayName = 'GradualBlur';

const injectStyles = () => {
  if (typeof document === 'undefined') return;
  const styleId = 'gradual-blur-styles';
  if (document.getElementById(styleId)) return;

  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = `
    .gradual-blur { pointer-events: none; }
    .gradual-blur-parent { overflow: hidden; }
    .gradual-blur-inner { pointer-events: none; }
  `;
  document.head.appendChild(styleElement);
};

if (typeof document !== 'undefined') {
  injectStyles();
}

export default GradualBlurMemo;
