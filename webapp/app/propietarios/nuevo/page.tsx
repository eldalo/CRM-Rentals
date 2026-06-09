'use client';

import { useRouter } from 'next/navigation';
import { Drawer } from '@/app/components/ui';
import { PropietarioForm } from '../_components/PropietarioForm';

export default function NuevoPropietarioPage() {
  const router = useRouter();
  return (
    <Drawer title="Nuevo propietario" onClose={() => router.push('/propietarios')}>
      <PropietarioForm />
    </Drawer>
  );
}
