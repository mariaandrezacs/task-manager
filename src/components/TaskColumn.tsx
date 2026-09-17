import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { STATUS_LABELS } from '../types';
import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onNewTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

export function TaskColumn({ status, tasks, onNewTask, onEditTask }: TaskColumnProps) {
  const { moveTaskTo } = useApp();
  const [over, setOver] = useState(false);

  return (
    <section
      className={`column column-${status} ${over ? 'drop-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id) void moveTaskTo(id, status);
      }}
    >
      <header className="column-header">
        <h2>
          {STATUS_LABELS[status]}
          <span className="count">{tasks.length}</span>
        </h2>
        <button
          className="icon-btn"
          title="Nova tarefa"
          aria-label={`Nova tarefa em ${STATUS_LABELS[status]}`}
          onClick={() => onNewTask(status)}
        >
          +
        </button>
      </header>

      <div className="column-body">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEditTask} />
        ))}
        {tasks.length === 0 && <p className="empty">Arraste tarefas para cá</p>}
      </div>
    </section>
  );
}
