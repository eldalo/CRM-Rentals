'use client';

import { useParams, useRouter } from 'next/navigation';
import { Drawer } from '@/app/components/ui';
import { InquilinoForm } from '../../_components/InquilinoForm';

export default function EditarInquilinoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  return (
    <Drawer title="Editar inquilino" onClose={() => router.push('/inquilinos')}>
      <InquilinoForm inquilinoId={id} />
    </Drawer>
  );
}
