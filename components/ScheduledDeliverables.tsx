import React from 'react';
import { Deliverable } from '../types';

interface ScheduledDeliverablesProps {
  items: Deliverable[];
}

export const ScheduledDeliverables: React.FC<ScheduledDeliverablesProps> = ({ items }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
        <h3 className="text-sm font-bold text-textMain">Scheduled Deliverables</h3>
      </div>
      
      <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between bg-surface border border-border hover:border-gray-600 rounded-md p-3 transition-colors group">
            <div className="flex items-center gap-3">
              <span className="text-xl bg-background rounded-md w-10 h-10 flex items-center justify-center border border-border">
                {item.icon}
              </span>
              <div>
                <div className="text-sm font-medium text-textMain">{item.title}</div>
                <div className="text-xs text-textMuted">{item.frequency}</div>
              </div>
            </div>
            <span className="text-[10px] uppercase font-semibold bg-[#21262d] text-textMuted px-2 py-1 rounded border border-border">
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
