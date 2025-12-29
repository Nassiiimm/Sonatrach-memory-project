import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';

const iconMap = {
  'total': FileText,
  'pending': Clock,
  'success': CheckCircle,
  'error': XCircle,
  'default': TrendingUp
};

const colorMap = {
  'total': '#f97316',
  'pending': '#eab308',
  'success': '#22c55e',
  'error': '#ef4444',
  'default': '#71717a'
};

export default function KPI({ label, value, hint, variant = 'default', icon }) {
  const IconComponent = icon || iconMap[variant] || iconMap.default;
  const color = colorMap[variant] || colorMap.default;

  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <div className="kpi-icon" style={{ color, background: `${color}15` }}>
          <IconComponent size={18} />
        </div>
        <div className="kpi-label">{label}</div>
      </div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}
