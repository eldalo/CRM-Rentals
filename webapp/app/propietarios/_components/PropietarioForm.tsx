'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  DeviceMobileIcon,
  EnvelopeIcon,
  FloppyDiskIcon,
  PowerIcon,
  UserIcon,
  XIcon,
} from '@phosphor-icons/react';
import { type Propietario } from '@/lib/api';
import { usePropietariosTodas, usePropietarioMutations } from '@/lib/queries';
import { Button, Input, Loading, Select, useDrawerClose } from '@/app/components/ui';

/** Crear (sin id) o editar (con id). Espera la cache antes de montar el form. */
export function PropietarioForm({ propietarioId }: { propietarioId?: string }) {
  const { data: items = [], isLoading } = usePropietariosTodas();

  if (!propietarioId) return <FormInner />;

  const propietario = items.find((p) => p.id === propietarioId);
  if (isLoading || (!propietario && items.length === 0)) return <Loading full />;
  if (!propietario) return <p className="text-sm text-red-600">Propietario no encontrado.</p>;
  return <FormInner propietario={propietario} />;
}

function FormInner({ propietario }: { propietario?: Propietario }) {
  const cerrar = useDrawerClose();
  const editar = !!propietario;
  const { crear, actualizar } = usePropietarioMutations();

  const [form, setForm] = useState({
    nombre_completo: propietario?.nombre_completo ?? '',
    celular: propietario?.celular ?? '',
    email: propietario?.email ?? '',
    estado: propietario?.estado ?? true,
  });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const dto = {
      nombre_completo: form.nombre_completo,
      celular: form.celular || undefined,
      email: form.email || undefined,
    };
    try {
      if (editar) {
        await actualizar.mutateAsync({ id: propietario!.id, dto: { ...dto, estado: form.estado } });
        toast.success('Propietario actualizado');
      } else {
        await crear.mutateAsync(dto);
        toast.success('Propietario creado');
      }
      cerrar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const guardando = crear.isPending || actualizar.isPending;

  return (
    <form onSubmit={guardar} className="space-y-4">
      <Input
        label="Nombre completo"
        icon={<UserIcon size={16} />}
        value={form.nombre_completo}
        onChange={(e) => setForm((f) => ({ ...f, nombre_completo: e.target.value }))}
        required
      />
      <Input
        label="Celular"
        formato="celular"
        icon={<DeviceMobileIcon size={16} />}
        value={form.celular}
        onChange={(e) => setForm((f) => ({ ...f, celular: e.target.value }))}
        hint="Mínimo 10 dígitos"
      />
      <Input
        label="Email"
        type="email"
        icon={<EnvelopeIcon size={16} />}
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      {editar && (
        <Select
          label="Estado"
          icon={<PowerIcon size={16} />}
          value={form.estado ? '1' : '0'}
          onChange={(v) => setForm((f) => ({ ...f, estado: v === '1' }))}
        >
          <option value="1">Activo</option>
          <option value="0">Inactivo</option>
        </Select>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" icon={<XIcon size={16} />} onClick={cerrar}>
          Cancelar
        </Button>
        <Button type="submit" loading={guardando} icon={<FloppyDiskIcon size={16} />}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
