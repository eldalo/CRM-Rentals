'use client';

import { useParams, useRouter } from 'next/navigation';
import { Drawer } from '@/app/components/ui';
import { PropietarioForm } from '../../_components/PropietarioForm';

export default function EditarPropietarioPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  return (
    <Drawer title="Editar propietario" onClose={() => router.push('/propietarios')}>
      <PropietarioForm propietarioId={id} />
    </Drawer>
  );
}
