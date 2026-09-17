import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../types';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { TagInput } from './TagInput';

interface TaskFormProps {
  /** Tarefa em edição; `undefined` = criação. */
  task?: Task;
  /** Status inicial ao criar (ex.: clicou em "+ Nova" dentro de uma coluna). */
  initialStatus?: TaskStatus;
  onClose: () => void;
}

export function TaskForm({ task, initialStatus, onClose }: TaskFormProps) {
  const { addTask, updateTask } = useApp();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? initialStatus ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [tags, setTags] = useState<string[]>(task?.tags ?? []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const input = { title: trimmed, description, status, priority, tags };
    if (task) void updateTask({ id: task.id, ...input });
    else void addTask(input);
    onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true">
        <h2>{task ? 'Editar tarefa' : 'Nova tarefa'}</h2>

        <label>
          Título
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="O que precisa ser feito?"
          />
        </label>

        <label>
          Descrição
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Detalhes opcionais…"
          />
        </label>

        <div className="form-row">
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prioridade
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Tags
          <TagInput tags={tags} onChange={setTags} />
        </label>

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn primary">
            {task ? 'Salvar' : 'Criar tarefa'}
          </button>
        </div>
      </form>
    </div>
  );
}
