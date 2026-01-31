import { ReactNode } from 'react';

interface MetricsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: ReactNode;
  highlight?: boolean;
  unit?: string;
  currency?: boolean;
}

// Format number with optional currency (AED - UAE Dirhams)
const formatValue = (value: number, currency?: boolean) => {
  if (currency) {
    return `AED ${value.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return value.toLocaleString();
};

export default function MetricsCard({ title, value, subtitle, icon, highlight, unit = 'Units', currency }: MetricsCardProps) {
  return (
    <div className={`rounded-xl p-6 shadow-lg transition-all hover:shadow-xl ${
      highlight ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${highlight ? 'text-primary-100' : 'text-gray-500'}`}>
          {title}
        </p>
        {icon}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <p className={`text-3xl font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>
          {formatValue(value, currency)}
        </p>
        {!currency && (
          <span className={`text-sm font-medium ${highlight ? 'text-primary-200' : 'text-gray-400'}`}>
            {unit}
          </span>
        )}
      </div>
      {subtitle && (
        <p className={`text-sm mt-1 ${highlight ? 'text-primary-200' : 'text-gray-400'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
