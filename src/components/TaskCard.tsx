import { useApp } from '../context/AppContext';
import { PRIORITY_LABELS } from '../types';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { deleteTask, moveTaskTo } = useApp();

  return (
    <article
      className="task-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = e.dataTransfer.getData('text/plain');
        if (id && id !== task.id) {
          void moveTaskTo(id, task.status, task.id);
        }
      }}
      onDoubleClick={() => onEdit(task)}
    >
      <div className="task-card-top">
        <span className={`badge priority-${task.priority}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        <div className="task-card-actions">
          <button
            className="icon-btn"
            title="Editar"
            aria-label="Editar tarefa"
            onClick={() => onEdit(task)}
          >
            ✎
          </button>
          <button
            className="icon-btn danger"
            title="Excluir"
            aria-label="Excluir tarefa"
            onClick={() => void deleteTask(task.id)}
          >
            ×
          </button>
        </div>
      </div>

      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}

      {task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map((tag) => (
            <span key={tag} className="chip small">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
