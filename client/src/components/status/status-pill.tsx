import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusKind = 'accepted' | 'approved' | 'pending' | 'in-progress' | 'warning' | 'error' | 'info' | 'default' 
  | 'completed' | 'open' | 'cancelled' | 'rejected' | 'on-hold' | 'overdue';

interface StatusPillProps {
  status: StatusKind | string; // allow free-form but map known ones
  children?: React.ReactNode; // custom label override
  className?: string;
  title?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  accepted: <Info className="h-4 w-4" />,
  confirmed: <Info className="h-4 w-4" />,
  approved: <CheckCircle2 className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
  'in-progress': <Clock className="h-4 w-4" />,
  pending: <Clock className="h-4 w-4" />,
  open: <Info className="h-4 w-4" />,
  'on-hold': <Clock className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
  overdue: <AlertTriangle className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  default: <Info className="h-4 w-4" />
};

// Unified style tokens
const baseClasses = 'inline-flex items-center gap-1.5 rounded-full border text-xs font-medium px-2 py-0.5 transition-colors h-6 min-w-[64px] justify-center';

const styleMap: Record<string, string> = {
  accepted: 'border-green-500 text-green-600 bg-green-50 shadow-sm',
  confirmed: 'border-green-500 text-green-600 bg-green-50 shadow-sm',
  approved: 'border-teal-500 text-teal-600 bg-teal-50 shadow-sm',
  completed: 'border-green-500 text-green-600 bg-green-50 shadow-sm',
  draft: 'border-gray-400 text-gray-600 bg-gray-50 shadow-sm',
  pending: 'border-orange-500 text-orange-600 bg-orange-50 shadow-sm',
  'in-progress': 'border-blue-500 text-blue-600 bg-blue-50 shadow-sm',
  open: 'border-sky-400 text-sky-600 bg-sky-50 shadow-sm',
  'on-hold': 'border-yellow-400 text-yellow-600 bg-yellow-50 shadow-sm',
  cancelled: 'border-gray-500 text-gray-600 bg-gray-50 shadow-sm',
  rejected: 'border-red-500 text-red-600 bg-red-50 shadow-sm',
  overdue: 'border-red-500 text-red-600 bg-red-50 shadow-sm',
  warning: 'border-yellow-300 text-yellow-700 bg-yellow-50',
  error: 'border-red-300 text-red-700 bg-red-50',
  info: 'border-blue-300 text-blue-700 bg-blue-50',
  default: 'border-gray-300 text-gray-700 bg-gray-50'
};

function normalize(status: string): keyof typeof styleMap {
  const s = status.toLowerCase();
  if (s === 'draft') return 'draft';
  if (s === 'confirmed') return 'confirmed';
  if (s.includes('complete')) return 'completed';
  if (s.includes('accept')) return 'accepted';
  if (s.includes('approve')) return 'approved';
  if (['pending','awaiting','waiting'].some(w => s.includes(w))) return 'pending';
  if (s.includes('progress')) return 'in-progress';
  if (s.includes('open')) return 'open';
  if (s.includes('hold')) return 'on-hold';
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('overdue')) return 'overdue';
  if (s.includes('warn')) return 'warning';
  if (['error','fail','reject','declined'].some(w => s.includes(w))) return 'rejected';
  if (['info','information','note'].some(w => s.includes(w))) return 'info';
  return 'default';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, children, className, title }) => {
  const key = normalize(status);
  return (
    <span className={cn(baseClasses, styleMap[key], className)} title={title || status} data-status={key}>
      <span className="flex items-center justify-center text-current">
        {iconMap[key] || iconMap.default}
      </span>
      <span>{children || (status.charAt(0).toUpperCase() + status.slice(1))}</span>
    </span>
  );
};

export default StatusPill;
