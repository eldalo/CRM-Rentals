'use client';

import { XIcon } from '@phosphor-icons/react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const DURACION = 300; // ms — debe coincidir con duration-300 de las clases.

// Permite a los hijos (formularios) cerrar con la misma animación.
const DrawerCloseContext = createContext<() => void>(() => {});
export const useDrawerClose = () => useContext(DrawerCloseContext);

interface DrawerProps {
  title: string;
  onClose: () => void; // se invoca DESPUÉS de la animación de salida (suele navegar).
  children: React.ReactNode;
}

/**
 * Panel lateral con animación: entra deslizando + fade de derecha a izquierda,
 * sale invertido. Cierra con Escape, backdrop, la X o `useDrawerClose()` desde
 * los hijos. El onClose (navegación) corre al terminar la salida.
 */
export function Drawer({ title, onClose, children }: DrawerProps) {
  const [visible, setVisible] = useState(false); // false = fuera de pantalla
  const cerrandoRef = useRef(false);

  // Anima la entrada en el siguiente frame (tras pintar el estado inicial).
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
    };
  }, []);

  const cerrar = useCallback(() => {
    if (cerrandoRef.current) return;
    cerrandoRef.current = true;
    setVisible(false); // dispara animación de salida
    setTimeout(onClose, DURACION); // navega al terminar
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cerrar]);

  return (
    <div className="fixed inset-0 z-40">
      <div
        onClick={cerrar}
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-all duration-300 ease-out ${
          visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button
            onClick={cerrar}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Cerrar"
          >
            <XIcon size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <DrawerCloseContext.Provider value={cerrar}>{children}</DrawerCloseContext.Provider>
        </div>
      </div>
    </div>
  );
}
