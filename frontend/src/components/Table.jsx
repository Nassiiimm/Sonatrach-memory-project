import React from 'react';

export default function Table({ columns, data }) {
  return (
    <div className="table-wrapper">
      <table className="table-root">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row._id || idx}>
              {columns.map(col => {
                const raw =
                  col.key && col.key.includes('.')
                    ? col.key.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), row)
                    : row[col.key];

                const content = col.render ? col.render(raw, row) : raw;
                return <td key={col.key}>{content}</td>;
              })}
            </tr>
          ))}
          {data.length === 0 && (
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