import React from 'react';
import { Calendar, X } from 'lucide-react';

export default function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  label = 'Periode'
}) {
  const hasFilters = startDate || endDate;

  return (
    <div className="date-range-filter">
      <label className="form-label">
        <Calendar size={12} /> {label}
      </label>
      <div className="date-range-inputs">
        <input
          type="date"
          className="input"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          placeholder="Du"
        />
        <span className="date-separator">au</span>
        <input
          type="date"
          className="input"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          placeholder="Au"
        />
        {hasFilters && onClear && (
          <button
            type="button"
            className="btn subtle date-clear-btn"
            onClick={onClear}
            title="Effacer les dates"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
