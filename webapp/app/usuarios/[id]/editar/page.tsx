'use client';

import { useParams, useRouter } from 'next/navigation';
import { Drawer } from '@/app/components/ui';
import { UsuarioForm } from '../../_components/UsuarioForm';

export default function EditarUsuarioPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  return (
    <Drawer title="Editar usuario" onClose={() => router.push('/usuarios')}>
      <UsuarioForm usuarioId={id} />
    </Drawer>
  );
}
