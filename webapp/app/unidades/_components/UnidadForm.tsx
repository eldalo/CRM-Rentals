'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  BuildingOfficeIcon,
  FloppyDiskIcon,
  MapPinIcon,
  PhoneIcon,
  PowerIcon,
  UserIcon,
  XIcon,
} from '@phosphor-icons/react';
import { type Unidad } from '@/lib/api';
import { useUnidadesTodas, useUnidadMutations } from '@/lib/queries';
import { Button, Input, Loading, Select, useDrawerClose } from '@/app/components/ui';

/** Crear (sin id) o editar (con id). Espera la cache antes de montar el form. */
export function UnidadForm({ unidadId }: { unidadId?: string }) {
  const { data: items = [], isLoading } = useUnidadesTodas();

  if (!unidadId) return <FormInner />;

  const unidad = items.find((u) => u.id === unidadId);
  if (isLoading || (!unidad && items.length === 0)) return <Loading full />;
  if (!unidad) return <p className="text-sm text-red-600">Unidad no encontrada.</p>;
  return <FormInner unidad={unidad} />;
}

function FormInner({ unidad }: { unidad?: Unidad }) {
  const cerrar = useDrawerClose();
  const editar = !!unidad;
  const { crear, actualizar } = useUnidadMutations();

  const [form, setForm] = useState({
    nombre: unidad?.nombre ?? '',
    direccion: unidad?.direccion ?? '',
    nombre_administrador: unidad?.nombre_administrador ?? '',
    contacto_administrador: unidad?.contacto_administrador ?? '',
    estado: unidad?.estado ?? true,
  });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const dto = {
      nombre: form.nombre,
      direccion: form.direccion,
      nombre_administrador: form.nombre_administrador || undefined,
      contacto_administrador: form.contacto_administrador || undefined,
    };
    try {
      if (editar) {
        await actualizar.mutateAsync({ id: unidad!.id, dto: { ...dto, estado: form.estado } });
        toast.success('Unidad actualizada');
      } else {
        await crear.mutateAsync(dto);
        toast.success('Unidad creada');
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
        label="Nombre de la unidad"
        icon={<BuildingOfficeIcon size={16} />}
        value={form.nombre}
        onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
        required
      />
      <Input
        label="Dirección"
        icon={<MapPinIcon size={16} />}
        value={form.direccion}
        onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
        required
      />
      <Input
        label="Nombre del administrador"
        icon={<UserIcon size={16} />}
        value={form.nombre_administrador}
        onChange={(e) => setForm((f) => ({ ...f, nombre_administrador: e.target.value }))}
      />
      <Input
        label="Contacto del administrador"
        formato="celular"
        icon={<PhoneIcon size={16} />}
        value={form.contacto_administrador}
        onChange={(e) => setForm((f) => ({ ...f, contacto_administrador: e.target.value }))}
        hint="Mínimo 10 dígitos"
      />
      {editar && (
        <Select
          label="Estado"
          icon={<PowerIcon size={16} />}
          value={form.estado ? '1' : '0'}
          onChange={(v) => setForm((f) => ({ ...f, estado: v === '1' }))}
        >
          <option value="1">Activa</option>
          <option value="0">Inactiva</option>
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
