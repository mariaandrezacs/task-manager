import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api';
import type { Task, TaskFilter, TaskInput, TaskStatus } from '../types';

const THEME_KEY = 'task-manager:theme';

export type Theme = 'light' | 'dark';

type TaskAction =
  | { type: 'setTasks'; tasks: Task[] }
  | { type: 'move'; id: string; status: TaskStatus; beforeId?: string };

interface AppState {
  tasks: Task[];
  filters: TaskFilter[];
  theme: Theme;
}

type AppAction =
  | TaskAction
  | { type: 'setFilters'; filters: TaskFilter[] }
  | { type: 'toggleTheme' };

function loadTheme(): Theme {
  const raw = localStorage.getItem(THEME_KEY);
  if (raw === 'light' || raw === 'dark') return raw;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/** Reordenação otimista local; o servidor é a fonte da verdade. */
function moveTask(
  tasks: Task[],
  id: string,
  status: TaskStatus,
  beforeId?: string,
): Task[] {
  const index = tasks.findIndex((t) => t.id === id);
  if (index < 0) return tasks;
  const next = [...tasks];
  const [task] = next.splice(index, 1);
  const moved = { ...task, status, updatedAt: Date.now() };

  const target = beforeId ? next.findIndex((t) => t.id === beforeId) : -1;
  if (target >= 0) next.splice(target, 0, moved);
  else next.push(moved);
  return next;
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'setTasks':
      return { ...state, tasks: action.tasks };
    case 'move':
      return {
        ...state,
        tasks: moveTask(state.tasks, action.id, action.status, action.beforeId),
      };
    case 'setFilters':
      return { ...state, filters: action.filters };
    case 'toggleTheme':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
  }
}

interface AppContextValue extends AppState {
  loading: boolean;
  error: string | null;
  addTask: (input: TaskInput) => Promise<void>;
  updateTask: (task: TaskInput & { id: string }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTaskTo: (id: string, status: TaskStatus, beforeId?: string) => Promise<void>;
  setFilters: (filters: TaskFilter[]) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    tasks: [],
    filters: [],
    theme: loadTheme(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const tasks = await api.list();
      dispatch({ type: 'setTasks', tasks });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao falar com a API');
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, state.theme);
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      try {
        await fn();
        await refresh();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao falar com a API');
      }
    },
    [refresh],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      loading,
      error,
      addTask: (input) => run(() => api.create(input)),
      updateTask: (task) => run(() => api.update(task)),
      deleteTask: (id) => run(() => api.remove(id)),
      moveTaskTo: async (id, status, beforeId) => {
        dispatch({ type: 'move', id, status, beforeId });
        await run(() => api.move(id, status, beforeId));
      },
      setFilters: (filters) => dispatch({ type: 'setFilters', filters }),
      toggleTheme: () => dispatch({ type: 'toggleTheme' }),
    }),
    [state, loading, error, run],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>');
  return ctx;
}
