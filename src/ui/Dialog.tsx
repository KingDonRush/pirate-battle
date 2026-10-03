import { useEffect, useId, useRef, type ReactNode } from 'react';
export function Dialog({
  title,
  children,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  const cleaning = useRef(false);
  useEffect(() => {
    cleaning.current = false;
    const dialog = ref.current,
      previous = document.activeElement;
    dialog?.showModal();
    return () => {
      cleaning.current = true;
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className="wood-panel modal"
      onCancel={(event) => {
        event.preventDefault();
        onCancel?.();
      }}
      onClose={(event) => {
        // A native close request can bypass cancellation after repeated Esc.
        if (cleaning.current || event.currentTarget.open) return;
        const dialog = event.currentTarget;
        onCancel?.();
        queueMicrotask(() => {
          // If its owner declined the transition (for example, lost WebGL),
          // keep the recovery UI available instead of leaving a frozen arena.
          if (!cleaning.current && dialog.isConnected && !dialog.open)
            dialog.showModal();
        });
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) onCancel?.();
      }}
    >
      <h2 id={id}>{title}</h2>
      {children}
    </dialog>
  );
}
