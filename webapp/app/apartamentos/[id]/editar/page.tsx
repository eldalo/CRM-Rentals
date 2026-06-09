'use client';

import { useParams, useRouter } from 'next/navigation';
import { Drawer } from '@/app/components/ui';
import { ApartamentoForm } from '../../_components/ApartamentoForm';

export default function EditarApartamentoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  return (
    <Drawer title="Editar apartamento" onClose={() => router.push('/apartamentos')}>
      <ApartamentoForm apartamentoId={id} />
    </Drawer>
  );
}
