'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  pressable?: boolean;
}

export function MobileCard({
  children,
  onClick,
  href,
  className = '',
  pressable = true,
}: MobileCardProps) {
  const baseClasses = `bg-surface-primary rounded-xl border border-border overflow-hidden ${className}`;

  const content = (
    <motion.div
      whileTap={pressable ? { scale: 0.98 } : undefined}
      className={baseClasses}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{children}</div>;
}

interface MobileListCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
  rightContent?: ReactNode;
  badge?: string | number;
  badgeColor?: string;
  showChevron?: boolean;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

export function MobileListCard({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-accent-primary',
  iconBgColor = 'bg-accent-50',
  rightContent,
  badge,
  badgeColor = 'bg-red-100 text-red-600',
  showChevron = true,
  onClick,
  href,
  disabled = false,
}: MobileListCardProps) {
  const content = (
    <motion.div
      whileTap={!disabled ? { scale: 0.98, backgroundColor: 'rgba(0,0,0,0.02)' } : undefined}
      className={`flex items-center gap-3 p-4 ${disabled ? 'opacity-50' : ''}`}
    >
      {Icon && (
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-content-primary truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-content-secondary truncate mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && (
          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
        {rightContent}
        {showChevron && (
          <ChevronRightIcon className="w-5 h-5 text-content-tertiary" />
        )}
      </div>
    </motion.div>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  if (onClick && !disabled) {
    return (
      <button onClick={onClick} className="w-full text-left" disabled={disabled}>
        {content}
      </button>
    );
  }

  return content;
}

interface MobileStatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    positive?: boolean;
  };
  icon?: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
  onClick?: () => void;
  href?: string;
}

export function MobileStatCard({
  label,
  value,
  change,
  icon: Icon,
  iconColor = 'text-accent-primary',
  iconBgColor = 'bg-accent-50',
  onClick,
  href,
}: MobileStatCardProps) {
  const content = (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="p-4"
    >
      <div className="flex items-start justify-between mb-2">
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${iconBgColor} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        )}
        {change && (
          <span className={`text-xs font-medium ${change.positive !== false ? 'text-green-600' : 'text-red-600'}`}>
            {change.positive !== false ? '+' : ''}{change.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-content-primary">{value}</p>
      <p className="text-xs text-content-secondary mt-0.5">{label}</p>
    </motion.div>
  );

  const wrapper = (
    <div className="bg-surface-primary rounded-xl border border-border overflow-hidden">
      {content}
    </div>
  );

  if (href) {
    return <Link href={href}>{wrapper}</Link>;
  }

  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{wrapper}</button>;
  }

  return wrapper;
}

interface MobileActionCardProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
  actionLabel: string;
  onAction: () => void;
  variant?: 'default' | 'warning' | 'success' | 'info';
}

export function MobileActionCard({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  variant = 'default',
}: MobileActionCardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-surface-primary',
      iconBg: 'bg-accent-50',
      iconColor: 'text-accent-primary',
      buttonBg: 'bg-accent-primary',
    },
    warning: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      buttonBg: 'bg-amber-500',
    },
    success: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-500',
    },
    info: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-500',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`rounded-xl border border-border overflow-hidden ${styles.bg}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${styles.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-content-primary">{title}</p>
            {description && (
              <p className="text-xs text-content-secondary mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className={`w-full mt-3 py-2.5 rounded-lg text-sm font-medium text-white ${styles.buttonBg} active:opacity-90 transition-opacity`}
        >
          {actionLabel}
        </motion.button>
      </div>
    </div>
  );
}
