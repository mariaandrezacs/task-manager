import { useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const tag = draft.trim().toLowerCase();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="tag-input" onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}>
      {tags.map((tag) => (
        <span key={tag} className="chip">
          {tag}
          <button
            type="button"
            aria-label={`Remover tag ${tag}`}
            onClick={() => onChange(tags.filter((t) => t !== tag))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={addTag}
        placeholder={tags.length ? '' : placeholder ?? 'Tags (Enter para adicionar)'}
      />
    </div>
  );
}
