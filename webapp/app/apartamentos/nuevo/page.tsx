'use client';

import { useRouter } from 'next/navigation';
import { Drawer } from '@/app/components/ui';
import { ApartamentoForm } from '../_components/ApartamentoForm';

export default function NuevoApartamentoPage() {
  const router = useRouter();
  return (
    <Drawer title="Nuevo apartamento" onClose={() => router.push('/apartamentos')}>
      <ApartamentoForm />
    </Drawer>
  );
}
