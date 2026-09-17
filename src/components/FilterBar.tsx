import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  describeFilter,
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
} from '../types';
import type { TaskFilter, TaskPriority, TaskStatus } from '../types';

export function FilterBar() {
  const { tasks, filters, setFilters } = useApp();

  const searchFilter = filters.find((f) => f.kind === 'search');
  const query = searchFilter?.kind === 'search' ? searchFilter.query : '';

  const allTags = useMemo(
    () => [...new Set(tasks.flatMap((t) => t.tags))].sort(),
    [tasks],
  );

  const setSearch = (value: string) => {
    const rest = filters.filter((f) => f.kind !== 'search');
    setFilters(value.trim() ? [...rest, { kind: 'search', query: value }] : rest);
  };

  const hasFilter = (f: TaskFilter) =>
    filters.some((x) => JSON.stringify(x) === JSON.stringify(f));

  const addFilter = (f: TaskFilter) => {
    if (!hasFilter(f)) setFilters([...filters, f]);
  };

  const removeFilter = (index: number) =>
    setFilters(filters.filter((_, i) => i !== index));

  return (
    <div className="filter-bar">
      <div className="filter-controls">
        <input
          type="search"
          className="search"
          placeholder="Buscar por título, descrição ou tag…"
          value={query}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value=""
          aria-label="Filtrar por status"
          onChange={(e) => {
            if (e.target.value)
              addFilter({ kind: 'status', status: e.target.value as TaskStatus });
            e.target.value = '';
          }}
        >
          <option value="">+ Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value=""
          aria-label="Filtrar por prioridade"
          onChange={(e) => {
            if (e.target.value)
              addFilter({ kind: 'priority', priority: e.target.value as TaskPriority });
            e.target.value = '';
          }}
        >
          <option value="">+ Prioridade</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>

        <select
          value=""
          aria-label="Filtrar por tag"
          disabled={allTags.length === 0}
          onChange={(e) => {
            if (e.target.value) addFilter({ kind: 'tag', tag: e.target.value });
            e.target.value = '';
          }}
        >
          <option value="">+ Tag</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {filters.length > 0 && (
        <div className="active-filters">
          {filters.map((f, i) => (
            <span key={i} className="chip filter-chip">
              {describeFilter(f)}
              <button
                aria-label="Remover filtro"
                onClick={() => removeFilter(i)}
              >
                ×
              </button>
            </span>
          ))}
          <button className="btn ghost small" onClick={() => setFilters([])}>
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
