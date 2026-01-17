import { ReactNode } from 'react';

interface MetricsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: ReactNode;
  highlight?: boolean;
}

export default function MetricsCard({ title, value, subtitle, icon, highlight }: MetricsCardProps) {
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
      <p className={`text-3xl font-bold mt-2 ${highlight ? 'text-white' : 'text-gray-900'}`}>
        {value.toLocaleString()}
      </p>
      {subtitle && (
        <p className={`text-sm mt-1 ${highlight ? 'text-primary-200' : 'text-gray-400'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
