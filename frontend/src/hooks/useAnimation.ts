'use client';

import * as React from 'react';

/**
 * Animation Hooks
 * 
 * Utilities for smooth, performant animations.
 */

/**
 * useReducedMotion Hook
 * 
 * Respects user's motion preferences.
 */

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

/**
 * useAnimatedNumber Hook
 * 
 * Smoothly animate number changes (for counters, metrics).
 */

export interface UseAnimatedNumberOptions {
  /** Animation duration in ms */
  duration?: number;
  /** Decimal places */
  decimals?: number;
  /** Easing function */
  easing?: (t: number) => number;
  /** Start animation on mount */
  animateOnMount?: boolean;
  /** Format function */
  format?: (value: number) => string;
}

// Easing functions
export const easings = {
  linear: (t: number) => t,
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeIn: (t: number) => t * t * t,
  spring: (t: number) => 1 - Math.cos(t * Math.PI * 0.5),
};

export function useAnimatedNumber(
  value: number,
  options: UseAnimatedNumberOptions = {}
) {
  const {
    duration = 500,
    decimals = 0,
    easing = easings.easeOut,
    animateOnMount = true,
    format,
  } = options;

  const [displayValue, setDisplayValue] = React.useState(animateOnMount ? 0 : value);
  const previousValue = React.useRef(animateOnMount ? 0 : value);
  const animationRef = React.useRef<number>();
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }

    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, easing, reducedMotion]);

  const formattedValue = React.useMemo(() => {
    const rounded = Number(displayValue.toFixed(decimals));
    return format ? format(rounded) : rounded.toLocaleString();
  }, [displayValue, decimals, format]);

  return {
    value: displayValue,
    formattedValue,
    isAnimating: displayValue !== value,
  };
}

/**
 * useStaggeredAnimation Hook
 * 
 * Create staggered animation delays for lists.
 */

export interface UseStaggeredAnimationOptions {
  /** Number of items */
  count: number;
  /** Delay between items in ms */
  stagger?: number;
  /** Initial delay in ms */
  initialDelay?: number;
}

export function useStaggeredAnimation({
  count,
  stagger = 50,
  initialDelay = 0,
}: UseStaggeredAnimationOptions) {
  const [visibleItems, setVisibleItems] = React.useState<number[]>([]);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (reducedMotion) {
      setVisibleItems(Array.from({ length: count }, (_, i) => i));
      return;
    }

    setVisibleItems([]);
    const timeouts: NodeJS.Timeout[] = [];

    for (let i = 0; i < count; i++) {
      const timeout = setTimeout(() => {
        setVisibleItems((prev) => [...prev, i]);
      }, initialDelay + i * stagger);
      timeouts.push(timeout);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [count, stagger, initialDelay, reducedMotion]);

  const getItemProps = (index: number) => ({
    style: {
      opacity: visibleItems.includes(index) ? 1 : 0,
      transform: visibleItems.includes(index)
        ? 'translateY(0)'
        : 'translateY(8px)',
      transition: reducedMotion
        ? 'none'
        : 'opacity 200ms ease-out, transform 200ms ease-out',
    },
  });

  return {
    visibleItems,
    getItemProps,
    isComplete: visibleItems.length === count,
  };
}

/**
 * useTransition Hook
 * 
 * Manage enter/exit animations.
 */

export type TransitionState = 'entering' | 'entered' | 'exiting' | 'exited';

export interface UseTransitionOptions {
  /** Whether the element is visible */
  isVisible: boolean;
  /** Enter duration in ms */
  enterDuration?: number;
  /** Exit duration in ms */
  exitDuration?: number;
  /** Callback when transition completes */
  onComplete?: (state: TransitionState) => void;
}

export function useTransition({
  isVisible,
  enterDuration = 200,
  exitDuration = 150,
  onComplete,
}: UseTransitionOptions) {
  const [state, setState] = React.useState<TransitionState>(
    isVisible ? 'entered' : 'exited'
  );
  const [shouldRender, setShouldRender] = React.useState(isVisible);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (reducedMotion) {
      setState(isVisible ? 'entered' : 'exited');
      setShouldRender(isVisible);
      return;
    }

    let timeout: NodeJS.Timeout;

    if (isVisible) {
      setShouldRender(true);
      setState('entering');
      timeout = setTimeout(() => {
        setState('entered');
        onComplete?.('entered');
      }, enterDuration);
    } else {
      setState('exiting');
      timeout = setTimeout(() => {
        setState('exited');
        setShouldRender(false);
        onComplete?.('exited');
      }, exitDuration);
    }

    return () => clearTimeout(timeout);
  }, [isVisible, enterDuration, exitDuration, onComplete, reducedMotion]);

  return {
    state,
    shouldRender,
    isEntering: state === 'entering',
    isEntered: state === 'entered',
    isExiting: state === 'exiting',
    isExited: state === 'exited',
  };
}

/**
 * useScrollAnimation Hook
 * 
 * Animate elements based on scroll position.
 */

export interface UseScrollAnimationOptions {
  /** Threshold (0-1) for triggering */
  threshold?: number;
  /** Only animate once */
  once?: boolean;
  /** Root margin */
  rootMargin?: string;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const { threshold = 0.1, once = true, rootMargin = '0px' } = options;
  const ref = React.useRef<T>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldAnimate = entry.isIntersecting && (!once || !hasAnimated.current);
        
        if (shouldAnimate) {
          setIsVisible(true);
          hasAnimated.current = true;
        } else if (!once) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}

/**
 * useSpring Hook
 * 
 * Spring physics animation.
 */

export interface UseSpringOptions {
  /** Spring stiffness */
  stiffness?: number;
  /** Damping ratio */
  damping?: number;
  /** Mass */
  mass?: number;
}

export function useSpring(
  target: number,
  options: UseSpringOptions = {}
) {
  const { stiffness = 100, damping = 10, mass = 1 } = options;

  const [current, setCurrent] = React.useState(target);
  const velocity = React.useRef(0);
  const animationRef = React.useRef<number>();
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (reducedMotion) {
      setCurrent(target);
      return;
    }

    let lastTime = performance.now();

    const animate = (time: number) => {
      const deltaTime = Math.min((time - lastTime) / 1000, 0.064);
      lastTime = time;

      const springForce = (target - current) * stiffness;
      const dampingForce = -velocity.current * damping;
      const acceleration = (springForce + dampingForce) / mass;

      velocity.current += acceleration * deltaTime;
      const newPosition = current + velocity.current * deltaTime;

      // Stop if close enough
      const isSettled =
        Math.abs(target - newPosition) < 0.001 &&
        Math.abs(velocity.current) < 0.001;

      if (isSettled) {
        setCurrent(target);
        velocity.current = 0;
      } else {
        setCurrent(newPosition);
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, stiffness, damping, mass, reducedMotion, current]);

  return current;
}
