import { UsuariosListView } from './_components/UsuariosListView';

/**
 * La lista de usuarios vive en el layout → permanece montada mientras se abre
 * el drawer (children) en /usuarios/nuevo, /usuarios/:id/editar, etc.
 */
export default function UsuariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UsuariosListView />
      {children}
    </>
  );
}
