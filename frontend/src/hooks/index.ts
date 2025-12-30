/**
 * Custom Hooks
 * 
 * Reusable hooks for the Wealth Management CRM.
 */

// Keyboard & Accessibility
export {
  useKeyboardNavigation,
  useFocusTrap,
  useRovingTabIndex,
  useHotkey,
  useEscapeKey,
  useClickOutside,
} from './useKeyboard';
export type {
  UseKeyboardNavigationOptions,
  UseFocusTrapOptions,
  UseRovingTabIndexOptions,
  UseHotkeyOptions,
} from './useKeyboard';

// Animation
export {
  useReducedMotion,
  useAnimatedNumber,
  useStaggeredAnimation,
  useTransition,
  useScrollAnimation,
  useSpring,
  easings,
} from './useAnimation';
export type {
  UseAnimatedNumberOptions,
  UseStaggeredAnimationOptions,
  TransitionState,
  UseTransitionOptions,
  UseScrollAnimationOptions,
  UseSpringOptions,
} from './useAnimation';
