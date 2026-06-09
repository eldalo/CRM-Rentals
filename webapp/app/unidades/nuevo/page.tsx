'use client';

import { useRouter } from 'next/navigation';
import { Drawer } from '@/app/components/ui';
import { UnidadForm } from '../_components/UnidadForm';

export default function NuevaUnidadPage() {
  const router = useRouter();
  return (
    <Drawer title="Nueva unidad" onClose={() => router.push('/unidades')}>
      <UnidadForm />
    </Drawer>
  );
}
