'use client';

import { useRouter } from 'next/navigation';
import { Drawer } from '@/app/components/ui';
import { UsuarioForm } from '../_components/UsuarioForm';

export default function NuevoUsuarioPage() {
  const router = useRouter();
  return (
    <Drawer title="Nuevo usuario" onClose={() => router.push('/usuarios')}>
      <UsuarioForm />
    </Drawer>
  );
}
