import { forwardRef, useImperativeHandle, useRef, useEffect,useState } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

interface ModalProps {
  children: React.ReactNode;
  buttonCaption: string;
}

export interface ModalHandle {
  open: () => void;
}

const Modal = forwardRef<ModalHandle, ModalProps>(function Modal({ children, buttonCaption }, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    setModalRoot(root);
  }, []);

  useImperativeHandle(ref, () => ({
    open() {
      dialogRef.current?.showModal();
    },
  }));

  if (!modalRoot) return null;

  return createPortal(
    <dialog ref={dialogRef} className="backdrop:bg-stone-900/90 p-4 rounded-md shadow-md">
      {children}
      <form method="dialog" className="mt-4 text-right">
        <Button>{buttonCaption}</Button>
      </form>
    </dialog>,
    modalRoot
  );
});

export default Modal;
