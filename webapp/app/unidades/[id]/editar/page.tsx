'use client';

import { useParams, useRouter } from 'next/navigation';
import { Drawer } from '@/app/components/ui';
import { UnidadForm } from '../../_components/UnidadForm';

export default function EditarUnidadPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  return (
    <Drawer title="Editar unidad" onClose={() => router.push('/unidades')}>
      <UnidadForm unidadId={id} />
    </Drawer>
  );
}
