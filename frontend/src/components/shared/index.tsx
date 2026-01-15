'use client';

/**
 * Shared Component Library
 *
 * This module consolidates common UI patterns and components used throughout
 * the CRM application. Import from this file for consistent styling and behavior.
 *
 * Usage:
 * import { Button, Card, Badge, StatusIndicator, ... } from '@/components/shared';
 */

import React, { forwardRef, createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent-primary text-white hover:bg-accent-primary/90 focus:ring-accent-primary/20',
  secondary: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 focus:ring-neutral-300/50',
  outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-300/50',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:ring-neutral-300/50',
  danger: 'bg-status-error text-white hover:bg-status-error/90 focus:ring-status-error/20',
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 font-medium rounded-lg
          transition-all duration-150 focus:outline-none focus:ring-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${buttonVariants[variant]}
          ${buttonSizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
        )}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';

// =============================================================================
// ICON BUTTON COMPONENT
// =============================================================================

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string; // Required for accessibility
}

const iconButtonSizes: Record<ButtonSize, string> = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'ghost', size = 'md', label, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={`
          inline-flex items-center justify-center rounded-lg
          transition-all duration-150 focus:outline-none focus:ring-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${buttonVariants[variant]}
          ${iconButtonSizes[size]}
          ${className}
        `}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

// =============================================================================
// BADGE COMPONENT
// =============================================================================

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-accent-primary/10 text-accent-primary',
  success: 'bg-status-success/10 text-status-success',
  warning: 'bg-status-warning/10 text-status-warning',
  error: 'bg-status-error/10 text-status-error',
  info: 'bg-status-info/10 text-status-info',
};

const badgeSizes: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  removable = false,
  onRemove,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${badgeVariants[variant]}
        ${badgeSizes[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-status-success' :
          variant === 'warning' ? 'bg-status-warning' :
          variant === 'error' ? 'bg-status-error' :
          variant === 'info' ? 'bg-status-info' :
          variant === 'primary' ? 'bg-accent-primary' :
          'bg-neutral-500'
        }`} />
      )}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        >
          <XMarkIcon className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

// =============================================================================
// STATUS INDICATOR COMPONENT
// =============================================================================

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'inactive';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const statusColors: Record<StatusType, string> = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
  info: 'bg-status-info',
  pending: 'bg-status-warning',
  inactive: 'bg-neutral-400',
};

const statusSizes: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export function StatusIndicator({
  status,
  label,
  size = 'md',
  pulse = false,
  className = '',
}: StatusIndicatorProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`relative rounded-full ${statusColors[status]} ${statusSizes[size]}`}>
        {pulse && (
          <span className={`absolute inset-0 rounded-full ${statusColors[status]} animate-ping opacity-75`} />
        )}
      </span>
      {label && <span className="text-sm text-neutral-700">{label}</span>}
    </span>
  );
}

// =============================================================================
// CARD COMPONENT
// =============================================================================

interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const cardPadding: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  padding = 'md',
  hover = false,
  selected = false,
  onClick,
  className = '',
}: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`
        bg-white rounded-lg border
        ${selected ? 'border-accent-primary ring-1 ring-accent-primary' : 'border-neutral-200'}
        ${hover ? 'hover:border-neutral-300 hover:shadow-sm transition-all' : ''}
        ${onClick ? 'text-left w-full cursor-pointer' : ''}
        ${cardPadding[padding]}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`font-semibold text-neutral-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mt-4 pt-4 border-t border-neutral-100 ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// ALERT COMPONENT
// =============================================================================

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
}

const alertVariants: Record<AlertVariant, { bg: string; border: string; icon: typeof InformationCircleIcon }> = {
  info: { bg: 'bg-status-info/10', border: 'border-status-info/20', icon: InformationCircleIcon },
  success: { bg: 'bg-status-success/10', border: 'border-status-success/20', icon: CheckCircleIcon },
  warning: { bg: 'bg-status-warning/10', border: 'border-status-warning/20', icon: ExclamationTriangleIcon },
  error: { bg: 'bg-status-error/10', border: 'border-status-error/20', icon: XCircleIcon },
};

export function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  action,
  className = '',
}: AlertProps) {
  const config = alertVariants[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={`
        rounded-lg border p-4
        ${config.bg} ${config.border}
        ${className}
      `}
    >
      <div className="flex gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 ${
          variant === 'success' ? 'text-status-success' :
          variant === 'warning' ? 'text-status-warning' :
          variant === 'error' ? 'text-status-error' :
          'text-status-info'
        }`} />
        <div className="flex-1">
          {title && (
            <h4 className={`font-medium mb-1 ${
              variant === 'success' ? 'text-status-success' :
              variant === 'warning' ? 'text-status-warning' :
              variant === 'error' ? 'text-status-error' :
              'text-status-info'
            }`}>
              {title}
            </h4>
          )}
          <div className="text-sm text-neutral-700">{children}</div>
          {action && <div className="mt-3">{action}</div>}
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
          >
            <XMarkIcon className="h-4 w-4 text-neutral-500" />
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PROGRESS BAR COMPONENT
// =============================================================================

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const progressSizes: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const progressColors: Record<'default' | 'success' | 'warning' | 'error', string> = {
  default: 'bg-accent-primary',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
};

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  animated = true,
  className = '',
}: ProgressBarProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-sm text-neutral-600">{label}</span>}
          {showLabel && <span className="text-sm font-medium text-neutral-900">{percent.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`bg-neutral-100 rounded-full overflow-hidden ${progressSizes[size]}`}>
        <motion.div
          className={`h-full rounded-full ${progressColors[variant]}`}
          initial={animated ? { width: 0 } : undefined}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// AVATAR COMPONENT
// =============================================================================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  status?: StatusType;
  className?: string;
}

const avatarSizes: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs', status: 'w-1.5 h-1.5' },
  sm: { container: 'w-8 h-8', text: 'text-sm', status: 'w-2 h-2' },
  md: { container: 'w-10 h-10', text: 'text-base', status: 'w-2.5 h-2.5' },
  lg: { container: 'w-12 h-12', text: 'text-lg', status: 'w-3 h-3' },
  xl: { container: 'w-16 h-16', text: 'text-xl', status: 'w-4 h-4' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

export function Avatar({ src, name, size = 'md', status, className = '' }: AvatarProps) {
  const sizeConfig = avatarSizes[size];
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative inline-flex ${className}`}>
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          className={`rounded-full object-cover ${sizeConfig.container}`}
        />
      ) : (
        <div
          className={`
            rounded-full flex items-center justify-center text-white font-medium
            ${getAvatarColor(name)}
            ${sizeConfig.container}
            ${sizeConfig.text}
          `}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full border-2 border-white
            ${statusColors[status]}
            ${sizeConfig.status}
          `}
        />
      )}
    </div>
  );
}

export function AvatarGroup({
  children,
  max = 4,
  size = 'md',
}: {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
}) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const remaining = childArray.length - max;
  const sizeConfig = avatarSizes[size];

  return (
    <div className="flex -space-x-2">
      {visibleChildren.map((child, index) => (
        <div key={index} className="relative" style={{ zIndex: visibleChildren.length - index }}>
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`
            rounded-full flex items-center justify-center bg-neutral-200 text-neutral-600 font-medium border-2 border-white
            ${sizeConfig.container}
            ${sizeConfig.text}
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-neutral-100 rounded-full text-neutral-400">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

// =============================================================================
// COLLAPSIBLE COMPONENT
// =============================================================================

interface CollapsibleProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Collapsible({
  trigger,
  children,
  defaultOpen = false,
  className = '',
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        {trigger}
        <ChevronRightIcon
          className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TABS COMPONENT
// =============================================================================

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = 'underline', className = '' }: TabsProps) {
  return (
    <div
      className={`
        flex gap-1
        ${variant === 'underline' ? 'border-b border-neutral-200' : ''}
        ${className}
      `}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
            ${variant === 'underline' ? (
              activeTab === tab.id
                ? 'border-b-2 border-accent-primary text-accent-primary -mb-px'
                : 'text-neutral-500 hover:text-neutral-700'
            ) : variant === 'pills' ? (
              activeTab === tab.id
                ? 'bg-accent-primary text-white rounded-lg'
                : 'text-neutral-500 hover:bg-neutral-100 rounded-lg'
            ) : (
              activeTab === tab.id
                ? 'bg-neutral-100 text-neutral-900 rounded-lg'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
          `}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <Badge size="sm" variant={activeTab === tab.id ? 'primary' : 'default'}>
              {tab.badge}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// LOADING COMPONENTS
// =============================================================================

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <ArrowPathIcon className={`animate-spin text-accent-primary ${sizes[size]} ${className}`} />
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-2" />
        {message && <p className="text-sm text-neutral-500">{message}</p>}
      </div>
    </div>
  );
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-neutral-200 rounded animate-pulse ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <Card padding="md">
      <SkeletonLine className="h-4 w-1/3 mb-4" />
      <SkeletonLine className="h-3 w-full mb-2" />
      <SkeletonLine className="h-3 w-2/3" />
    </Card>
  );
}

// =============================================================================
// TOOLTIP COMPONENT
// =============================================================================

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-flex" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`
              absolute z-tooltip px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg
              whitespace-nowrap pointer-events-none
              ${positionClasses[position]}
            `}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// DIVIDER COMPONENT
// =============================================================================

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

export function Divider({ orientation = 'horizontal', label, className = '' }: DividerProps) {
  if (orientation === 'vertical') {
    return <div className={`w-px bg-neutral-200 self-stretch ${className}`} />;
  }

  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-xs text-neutral-500 font-medium">{label}</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>
    );
  }

  return <div className={`h-px bg-neutral-200 ${className}`} />;
}

// =============================================================================
// KEY-VALUE DISPLAY COMPONENT
// =============================================================================

interface KeyValueProps {
  label: string;
  value: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function KeyValue({ label, value, direction = 'vertical', className = '' }: KeyValueProps) {
  return (
    <div
      className={`
        ${direction === 'horizontal' ? 'flex items-center justify-between' : ''}
        ${className}
      `}
    >
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className={`font-medium text-neutral-900 ${direction === 'vertical' ? 'mt-1' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

// =============================================================================
// METRIC DISPLAY COMPONENT
// =============================================================================

interface MetricProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function Metric({
  label,
  value,
  change,
  changeLabel,
  icon,
  trend,
  className = '',
}: MetricProps) {
  const trendColors = {
    up: 'text-status-success',
    down: 'text-status-error',
    neutral: 'text-neutral-500',
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-neutral-500">{label}</span>
        {icon && <span className="text-neutral-400">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-neutral-900">{value}</div>
      {change !== undefined && (
        <div className={`text-sm mt-1 ${trend ? trendColors[trend] : trendColors.neutral}`}>
          {change > 0 ? '+' : ''}{change}%
          {changeLabel && <span className="text-neutral-500 ml-1">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  ButtonVariant,
  ButtonSize,
  ButtonProps,
  IconButtonProps,
  BadgeVariant,
  BadgeSize,
  BadgeProps,
  StatusType,
  StatusIndicatorProps,
  CardProps,
  AlertVariant,
  AlertProps,
  ProgressBarProps,
  AvatarSize,
  AvatarProps,
  EmptyStateProps,
  CollapsibleProps,
  Tab,
  TabsProps,
  TooltipProps,
  DividerProps,
  KeyValueProps,
  MetricProps,
};
