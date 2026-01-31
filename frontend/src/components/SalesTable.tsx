'use client';

import { Sale } from '@/types';
import { format, parseISO } from 'date-fns';

interface SalesTableProps {
  sales: Sale[];
  storeMap?: Record<number, string>;
  itemMap?: Record<number, string>;
}

export default function SalesTable({ sales, storeMap = {}, itemMap = {} }: SalesTableProps) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No sales data available
      </div>
    );
  }
  
  const getStoreName = (storeId: number) => {
    return storeMap[storeId] || `Store ${storeId}`;
  };
  
  const getItemName = (itemId: number) => {
    return itemMap[itemId] || `Item ${itemId}`;
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Store
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Qty (Units)
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sales.map((sale, index) => (
            <tr 
              key={sale.id || index} 
              className={`${sale.is_streaming ? 'animate-fade-in bg-blue-50' : ''} hover:bg-gray-50 transition-colors`}
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {format(parseISO(sale.date), 'MMM dd, yyyy')}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={getStoreName(sale.store_id)}>
                {getStoreName(sale.store_id)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={getItemName(sale.item_id)}>
                {getItemName(sale.item_id)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {sale.sales}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sale.is_streaming 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {sale.is_streaming ? '● Live' : 'Historical'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
