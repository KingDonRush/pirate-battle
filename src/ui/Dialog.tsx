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
  useEffect(() => {
    const dialog = ref.current,
      previous = document.activeElement;
    dialog?.showModal();
    return () => {
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
    >
      <h2 id={id}>{title}</h2>
      {children}
    </dialog>
  );
}
