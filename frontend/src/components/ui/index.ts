/**
 * UI Component Library
 * 
 * A design system for the Wealth Management CRM.
 * Implements quiet luxury aesthetic with institutional polish.
 */

// Utilities
export { cn, formatCurrency, formatDate, formatDateTime, formatRelativeTime } from './utils';

// Button
export { Button, IconButton } from './Button';
export type { ButtonProps, IconButtonProps } from './Button';

// Card
export { Card, CardHeader, CardContent, CardFooter } from './Card';
export type { CardProps, CardHeaderProps } from './Card';

// Badge
export { Badge, StatusBadge, CountBadge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize, StatusBadgeProps, CountBadgeProps } from './Badge';

// MetricCard
export { MetricCard, MetricGrid } from './MetricCard';
export type { MetricCardProps, MetricGridProps, MetricIconType } from './MetricCard';

// Progress
export { Progress, GoalProgress } from './Progress';
export type { ProgressProps, GoalProgressProps } from './Progress';

// Callout & Action Center
export { Callout, ActionItem, ActionCenter } from './Callout';
export type { CalloutProps, CalloutVariant, ActionItemProps, ActionCenterProps } from './Callout';

// Table
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  EmptyState,
} from './Table';
export type { TableProps, TableHeadProps, EmptyStateProps } from './Table';

// Skeleton
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonDashboard,
} from './Skeleton';
export type { SkeletonProps, SkeletonTextProps, SkeletonTableProps, SkeletonAvatarProps } from './Skeleton';

// Input
export { Input, Textarea, FormGroup, FormRow } from './Input';
export type { InputProps, TextareaProps } from './Input';

// Select
export { Select, NativeSelect } from './Select';
export type { SelectProps, SelectOption, NativeSelectProps } from './Select';

// Checkbox & Radio
export { Checkbox, Radio, RadioGroup, CheckboxGroup, Switch } from './Checkbox';
export type { CheckboxProps, RadioProps, RadioGroupProps, CheckboxGroupProps, SwitchProps } from './Checkbox';

// Avatar
export { Avatar, AvatarGroup, AvatarWithName } from './Avatar';
export type { AvatarProps, AvatarGroupProps, AvatarWithNameProps } from './Avatar';

// Tooltip
export { Tooltip, TooltipInfo } from './Tooltip';
export type { TooltipProps, TooltipInfoProps } from './Tooltip';

// Modal
export { Modal, ModalFooter, ConfirmModal, SlideOver } from './Modal';
export type { ModalProps, ModalFooterProps, ConfirmModalProps, SlideOverProps } from './Modal';

// Command Palette
export { CommandPalette, useCommandPalette } from './CommandPalette';
export type { CommandPaletteProps, CommandItem } from './CommandPalette';

// Data Visualization
export { Sparkline, TrendIndicator, MiniBarChart, DonutChart, SegmentedDonutChart, ComparisonBar } from './DataViz';
export type { SparklineProps, TrendIndicatorProps, MiniBarChartProps, DonutChartProps, SegmentedDonutChartProps, SegmentedDonutChartData, ComparisonBarProps } from './DataViz';

// DataTable
export { DataTable } from './DataTable';
export type { DataTableProps, Column, SortDirection } from './DataTable';
