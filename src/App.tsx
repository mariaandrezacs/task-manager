import { useState } from 'react';
import { FilterBar } from './components/FilterBar';
import { TaskColumn } from './components/TaskColumn';
import { TaskForm } from './components/TaskForm';
import { useApp } from './context/AppContext';
import { applyFilters, STATUSES } from './types';
import type { Task, TaskStatus } from './types';

type FormState =
  | { mode: 'create'; status: TaskStatus }
  | { mode: 'edit'; task: Task }
  | null;

export default function App() {
  const { tasks, filters, theme, loading, error, toggleTheme } = useApp();
  const [form, setForm] = useState<FormState>(null);

  const visible = applyFilters(tasks, filters);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Manager</h1>
        <div className="header-actions">
          <button
            className="btn primary"
            onClick={() => setForm({ mode: 'create', status: 'todo' })}
          >
            + Nova tarefa
          </button>
          <button
            className="icon-btn theme-toggle"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            aria-label="Alternar tema"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <FilterBar />

      {error && (
        <p className="api-error" role="alert">
          {error} — verifique se a API está no ar (docker compose up).
        </p>
      )}

      {loading ? (
        <p className="loading">Carregando tarefas…</p>
      ) : (
      <main className="board">
        {STATUSES.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={visible.filter((t) => t.status === status)}
            onNewTask={(s) => setForm({ mode: 'create', status: s })}
            onEditTask={(task) => setForm({ mode: 'edit', task })}
          />
        ))}
      </main>
      )}

      {form && (
        <TaskForm
          task={form.mode === 'edit' ? form.task : undefined}
          initialStatus={form.mode === 'create' ? form.status : undefined}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
