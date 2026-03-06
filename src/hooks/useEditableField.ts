import { useState } from 'react';

export function useEditableField(initialValue: string) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue);

  const startEdit = (value: string) => {
    setDraft(value);
    setEditing(true);
  };

  const cancel = () => setEditing(false);
  const stopEditing = () => setEditing(false);

  return { editing, draft, setDraft, startEdit, cancel, stopEditing };
}
