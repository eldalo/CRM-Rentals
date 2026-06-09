'use client';

import { useRouter } from 'next/navigation';
import { Drawer } from '@/app/components/ui';
import { InquilinoForm } from '../_components/InquilinoForm';

export default function NuevoInquilinoPage() {
  const router = useRouter();
  return (
    <Drawer title="Nuevo inquilino" onClose={() => router.push('/inquilinos')}>
      <InquilinoForm />
    </Drawer>
  );
}
