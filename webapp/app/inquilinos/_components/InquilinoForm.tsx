'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  BuildingsIcon,
  DeviceMobileIcon,
  EnvelopeIcon,
  FloppyDiskIcon,
  IdentificationCardIcon,
  PhoneIcon,
  PowerIcon,
  UserCircleIcon,
  UserIcon,
  XIcon,
} from '@phosphor-icons/react';
import { aptoLabel, type Inquilino } from '@/lib/api';
import {
  useInquilinos,
  useApartamentosTodos,
  useActualizarInquilino,
  useCrearInquilino,
} from '@/lib/queries';
import { Button, Input, Loading, Select, useDrawerClose } from '@/app/components/ui';

/** Crear (sin id) o editar (con id). Espera la cache antes de montar el form. */
export function InquilinoForm({ inquilinoId }: { inquilinoId?: string }) {
  const { data: items = [], isLoading } = useInquilinos();

  if (!inquilinoId) return <FormInner />;

  const inq = items.find((i) => i.id === inquilinoId);
  if (isLoading || (!inq && items.length === 0)) return <Loading full />;
  if (!inq) return <p className="text-sm text-red-600">Inquilino no encontrado.</p>;
  return <FormInner inquilino={inq} />;
}

function FormInner({ inquilino }: { inquilino?: Inquilino }) {
  const cerrar = useDrawerClose();
  const editar = !!inquilino;
  const crear = useCrearInquilino();
  const actualizar = useActualizarInquilino();
  const { data: apartamentos = [] } = useApartamentosTodos();

  const [form, setForm] = useState({
    apartamento_id: inquilino?.apartamento_id ?? '',
    nombre_completo: inquilino?.nombre_completo ?? '',
    cedula: inquilino?.cedula ?? '',
    celular: inquilino?.celular ?? '',
    email: inquilino?.email ?? '',
    nombre_referencia_personal: inquilino?.nombre_referencia_personal ?? '',
    celular_referencia_personal: inquilino?.celular_referencia_personal ?? '',
    nombre_2_referencia_personal: inquilino?.nombre_2_referencia_personal ?? '',
    celular_2_referencia_personal: inquilino?.celular_2_referencia_personal ?? '',
    estado: inquilino?.estado ?? true,
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const dto = {
      apartamento_id: form.apartamento_id,
      nombre_completo: form.nombre_completo,
      cedula: form.cedula || undefined,
      celular: form.celular || undefined,
      email: form.email || undefined,
      nombre_referencia_personal: form.nombre_referencia_personal || undefined,
      celular_referencia_personal: form.celular_referencia_personal || undefined,
      nombre_2_referencia_personal: form.nombre_2_referencia_personal || undefined,
      celular_2_referencia_personal: form.celular_2_referencia_personal || undefined,
    };
    try {
      if (editar) {
        await actualizar.mutateAsync({ id: inquilino!.id, dto: { ...dto, estado: form.estado } });
        toast.success('Inquilino actualizado');
      } else {
        await crear.mutateAsync(dto);
        toast.success('Inquilino creado');
      }
      cerrar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const guardando = crear.isPending || actualizar.isPending;

  return (
    <form onSubmit={guardar} className="space-y-4">
      <Select
        label="Apartamento"
        icon={<BuildingsIcon size={16} />}
        value={form.apartamento_id}
        onChange={(v) => setForm((f) => ({ ...f, apartamento_id: v }))}
        required
      >
        <option value="" disabled>
          Selecciona un apartamento…
        </option>
        {apartamentos.map((a) => (
          <option key={a.id} value={a.id}>
            {aptoLabel(a)}
          </option>
        ))}
      </Select>
      <Input
        label="Nombre completo"
        icon={<UserIcon size={16} />}
        value={form.nombre_completo}
        onChange={set('nombre_completo')}
        required
      />
      <Input
        label="Cédula"
        icon={<IdentificationCardIcon size={16} />}
        value={form.cedula}
        onChange={set('cedula')}
      />
      <Input
        label="Celular"
        formato="celular"
        icon={<DeviceMobileIcon size={16} />}
        value={form.celular}
        onChange={set('celular')}
        hint="Mínimo 10 dígitos"
      />
      <Input
        label="Email"
        type="email"
        icon={<EnvelopeIcon size={16} />}
        value={form.email}
        onChange={set('email')}
      />

      <div className="border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Referencia personal
        </p>
        <div className="space-y-4">
          <Input
            label="Nombre"
            icon={<UserCircleIcon size={16} />}
            value={form.nombre_referencia_personal}
            onChange={set('nombre_referencia_personal')}
          />
          <Input
            label="Celular"
            formato="celular"
            icon={<PhoneIcon size={16} />}
            value={form.celular_referencia_personal}
            onChange={set('celular_referencia_personal')}
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Referencia personal 2
        </p>
        <div className="space-y-4">
          <Input
            label="Nombre"
            icon={<UserCircleIcon size={16} />}
            value={form.nombre_2_referencia_personal}
            onChange={set('nombre_2_referencia_personal')}
          />
          <Input
            label="Celular"
            formato="celular"
            icon={<PhoneIcon size={16} />}
            value={form.celular_2_referencia_personal}
            onChange={set('celular_2_referencia_personal')}
          />
        </div>
      </div>

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
