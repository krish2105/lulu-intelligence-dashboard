'use client';

import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { Prediction } from '@/types';
import { format, parseISO } from 'date-fns';

interface PredictionCardProps {
  predictions: Prediction[];
}

export default function PredictionCard({ predictions }: PredictionCardProps) {
  if (predictions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <p>No predictions available</p>
          <p className="text-sm mt-2">Need more historical data to generate forecasts</p>
        </div>
      </div>
    );
  }
  
  const chartData = predictions.slice(0, 30).map(item => ({
    ...item,
    formattedDate: format(parseISO(item.prediction_date), 'MMM dd'),
  }));
  
  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="formattedDate" 
            tick={{ fontSize: 11 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: 'none', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                predicted_sales: 'Predicted',
                confidence_lower: 'Lower Bound',
                confidence_upper: 'Upper Bound',
              };
              return [value.toFixed(1), labels[name] || name];
            }}
          />
          <Area 
            type="monotone" 
            dataKey="confidence_upper" 
            stroke="transparent"
            fill="url(#colorConfidence)" 
          />
          <Area 
            type="monotone" 
            dataKey="confidence_lower" 
            stroke="transparent"
            fill="white" 
          />
          <Line 
            type="monotone" 
            dataKey="predicted_sales" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Predicted Sales</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-200"></div>
          <span>95% Confidence Interval</span>
        </div>
      </div>
    </div>
  );
}
