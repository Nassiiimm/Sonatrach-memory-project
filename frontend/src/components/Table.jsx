import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function Table({ columns, data, defaultSortKey = null, defaultSortDir = 'asc' }) {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState(defaultSortDir);

  const handleSort = (col) => {
    if (!col.sortable) return;

    if (sortKey === col.key) {
      // Toggle direction or clear sort
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  };

  const getValue = (row, key) => {
    if (!key) return undefined;
    if (key.includes('.')) {
      return key.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), row);
    }
    return row[key];
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    const col = columns.find(c => c.key === sortKey);
    if (!col) return data;

    return [...data].sort((a, b) => {
      let aVal = getValue(a, sortKey);
      let bVal = getValue(b, sortKey);

      // Use sortValue function if provided
      if (col.sortValue) {
        aVal = col.sortValue(aVal, a);
        bVal = col.sortValue(bVal, b);
      }

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === 'asc' ? 1 : -1;
      if (bVal == null) return sortDir === 'asc' ? -1 : 1;

      // Handle dates
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle date strings
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const dateA = Date.parse(aVal);
        const dateB = Date.parse(bVal);
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
        }
      }

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings (case-insensitive)
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (sortDir === 'asc') {
        return strA.localeCompare(strB, 'fr');
      }
      return strB.localeCompare(strA, 'fr');
    });
  }, [data, sortKey, sortDir, columns]);

  const renderSortIcon = (col) => {
    if (!col.sortable) return null;

    if (sortKey !== col.key) {
      return <ChevronsUpDown size={12} className="sort-icon neutral" />;
    }

    if (sortDir === 'asc') {
      return <ChevronUp size={12} className="sort-icon active" />;
    }
    return <ChevronDown size={12} className="sort-icon active" />;
  };

  return (
    <div className="table-wrapper">
      <table className="table-root">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col)}
                className={col.sortable ? 'sortable' : ''}
                style={col.sortable ? { cursor: 'pointer', userSelect: 'none' } : {}}
              >
                <span className="th-content">
                  {col.title}
                  {renderSortIcon(col)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <tr key={row._id || idx}>
              {columns.map(col => {
                const raw = getValue(row, col.key);
                const content = col.render ? col.render(raw, row) : raw;
                return <td key={col.key}>{content}</td>;
              })}
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                Aucun enregistrement
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
