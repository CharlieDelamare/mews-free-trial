'use client';

import { useCallback } from 'react';

export type ColumnDef<T> = {
  key: keyof T;
  label: string;
  type?: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  width?: string;
  placeholder?: string;
};

interface EditableTableProps<T extends object> {
  rows: T[];
  columns: ColumnDef<T>[];
  onChange: (rows: T[]) => void;
  emptyRow: () => T;
  addLabel?: string;
  /** If true, hides the Add row button */
  readOnly?: boolean;
}

export function EditableTable<T extends object>({
  rows,
  columns,
  onChange,
  emptyRow,
  addLabel = 'Add row',
  readOnly = false,
}: EditableTableProps<T>) {
  const update = useCallback(
    (rowIndex: number, key: keyof T, value: unknown) => {
      const next = rows.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r));
      onChange(next);
    },
    [rows, onChange],
  );

  const addRow = () => onChange([...rows, emptyRow()]);

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
            {!readOnly && (
              <th className="px-3 py-2" style={{ width: '40px' }} />
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (readOnly ? 0 : 1)}
                className="px-3 py-6 text-center text-gray-400 text-xs"
              >
                No rows yet. {!readOnly && 'Click "Add row" to start.'}
              </td>
            </tr>
          )}
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => {
                const value = (row as Record<string, unknown>)[col.key as string];

                return (
                  <td key={String(col.key)} className="px-3 py-1.5 align-middle">
                    {col.type === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        disabled={readOnly}
                        onChange={(e) => update(rowIndex, col.key, e.target.checked)}
                        className="rounded border-gray-300 text-mews-primary focus:ring-mews-primary disabled:opacity-50"
                      />
                    ) : col.type === 'select' ? (
                      <select
                        value={String(value ?? '')}
                        disabled={readOnly}
                        onChange={(e) => update(rowIndex, col.key, e.target.value)}
                        className="w-full text-sm border border-transparent bg-transparent focus:border-[var(--mews-primary-pink)] focus:ring-1 focus:ring-[var(--mews-primary-pink)] focus:outline-none rounded px-1 py-0.5 disabled:opacity-50"
                      >
                        <option value="">—</option>
                        {(col.options ?? []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={String(value ?? '')}
                        readOnly={readOnly}
                        placeholder={col.placeholder ?? '—'}
                        onChange={(e) =>
                          update(
                            rowIndex,
                            col.key,
                            col.type === 'number' ? Number(e.target.value) : e.target.value,
                          )
                        }
                        className="w-full text-sm bg-transparent border border-transparent rounded px-2 py-0.5 focus:border-[var(--mews-primary-pink)] focus:outline-none focus:ring-1 focus:ring-[var(--mews-primary-pink)] text-gray-700 placeholder:text-gray-300 placeholder:not-italic disabled:opacity-50 read-only:cursor-default"
                      />
                    )}
                  </td>
                );
              })}
              {!readOnly && (
                <td className="px-1 py-1.5 align-middle">
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors rounded"
                    aria-label="Remove row"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={addRow}
            className="text-xs text-mews-primary hover:text-mews-primary-hover font-medium flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}
