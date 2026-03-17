import { useEffect, useRef, useCallback, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface UseAutoSaveOptions {
  editor: Editor | null;
  onSave: () => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoSaveResult {
  isSaving: boolean;
  hasChanges: boolean;
  lastSavedAt: Date | null;
  saveError: Error | null;
  triggerSave: () => Promise<void>;
}

export const useAutoSave = ({
  editor,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveResult => {
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<Error | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');
  const pendingSaveRef = useRef<Promise<void> | null>(null);

  const performSave = useCallback(async () => {
    if (!editor || pendingSaveRef.current) return;

    const currentContent = JSON.stringify(editor.getJSON());
    
    // Don't save if content hasn't changed
    if (currentContent === lastContentRef.current) {
      setHasChanges(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    pendingSaveRef.current = onSave()
      .then(() => {
        lastContentRef.current = currentContent;
        setLastSavedAt(new Date());
        setHasChanges(false);
      })
      .catch((error) => {
        setSaveError(error);
        throw error;
      })
      .finally(() => {
        setIsSaving(false);
        pendingSaveRef.current = null;
      });

    await pendingSaveRef.current;
  }, [editor, onSave]);

  const debouncedSave = useCallback(() => {
    if (!editor || !enabled) return;

    setHasChanges(true);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, delay);
  }, [editor, enabled, delay, performSave]);

  const triggerSave = useCallback(async () => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await performSave();
  }, [performSave]);

  useEffect(() => {
    if (!editor || !enabled) return;

    // Listen to all transactions (content changes)
    const handleUpdate = () => {
      debouncedSave();
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, enabled, debouncedSave]);

  return {
    isSaving,
    hasChanges,
    lastSavedAt,
    saveError,
    triggerSave,
  };
};
