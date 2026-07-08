import React from 'react';
import { Wifi, ShieldAlert, Database } from 'lucide-react';

export default function DataSourceBadge({ source }) {
  if (!source) return null;

  let label = 'Lokal';
  let colorClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  let Icon = Database;

  if (source === 'mangadex') {
    label = 'Live';
    colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    Icon = Wifi;
  } else if (source === 'jikan') {
    label = 'Cadangan';
    colorClass = 'bg-brand-orange/10 text-brand-orange border-brand-orange/20';
    Icon = ShieldAlert;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
