'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  BuildingOfficeIcon,
  CalendarDotsIcon,
  FloppyDiskIcon,
  HashIcon,
  IdentificationBadgeIcon,
  MoneyIcon,
  PowerIcon,
  ShieldCheckIcon,
  UserIcon,
  XIcon,
} from '@phosphor-icons/react';
import { ROL_LABEL, type Apartamento } from '@/lib/api';
import {
  useApartamentosTodos,
  useUnidadesTodas,
  usePropietariosTodas,
  useUsuariosTodas,
  useMe,
  useActualizarApartamento,
  useCrearApartamento,
} from '@/lib/queries';
import { Button, Input, Loading, Select, useDrawerClose } from '@/app/components/ui';

/** Crear (sin id) o editar (con id). Espera la cache antes de montar el form. */
export function ApartamentoForm({ apartamentoId }: { apartamentoId?: string }) {
  const { data: items = [], isLoading } = useApartamentosTodos();

  if (!apartamentoId) return <FormInner />;

  const apto = items.find((a) => a.id === apartamentoId);
  if (isLoading || (!apto && items.length === 0)) return <Loading full />;
  if (!apto) return <p className="text-sm text-red-600">Apartamento no encontrado.</p>;
  return <FormInner apto={apto} />;
}

function FormInner({ apto }: { apto?: Apartamento }) {
  const cerrar = useDrawerClose();
  const editar = !!apto;
  const crear = useCrearApartamento();
  const actualizar = useActualizarApartamento();
  const { data: unidades = [] } = useUnidadesTodas();
  const { data: propietarios = [] } = usePropietariosTodas();
  const { data: me } = useMe();
  const esAsesor = me?.rol === 'asesor';
  // El asesor queda fijo como responsable (no elige); solo admin/super ven la
  // lista. /usuarios es admin-only, así que solo se consulta para ellos.
  const { data: usuarios = [] } = useUsuariosTodas(!!me && !esAsesor);
  // Responsables elegibles: todos menos super_admin (asesores y admins activos).
  const responsables = usuarios.filter((u) => u.estado && (u.rol === 'asesor' || u.rol === 'admin'));

  const [form, setForm] = useState({
    unidad_id: apto?.unidad_id ?? '',
    numero: apto?.numero ?? '',
    canon: apto ? String(apto.canon) : '',
    dia_corte: apto ? String(apto.dia_corte) : '',
    propietario_id: apto?.propietario_id ?? '',
    responsable_id: apto?.responsable_id ?? '',
    asegurado: apto?.asegurado ?? false,
    estado: apto?.estado ?? true,
  });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const base = {
      unidad_id: form.unidad_id,
      numero: form.numero,
      canon: Number(form.canon),
      dia_corte: Number(form.dia_corte),
      propietario_id: form.propietario_id,
      // Asesor: se fuerza a sí mismo (el backend también lo valida).
      responsable_id: esAsesor && me ? me.id : form.responsable_id,
      asegurado: form.asegurado,
    };
    try {
      if (editar) {
        await actualizar.mutateAsync({ id: apto!.id, dto: { ...base, estado: form.estado } });
        toast.success('Apartamento actualizado');
      } else {
        await crear.mutateAsync(base);
        toast.success('Apartamento creado');
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
        label="Unidad"
        icon={<BuildingOfficeIcon size={16} />}
        value={form.unidad_id}
        onChange={(v) => setForm((f) => ({ ...f, unidad_id: v }))}
        required
      >
        <option value="" disabled>
          Selecciona una unidad…
        </option>
        {unidades.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nombre} — {u.direccion}
          </option>
        ))}
      </Select>
      <Input
        label="Número del apartamento"
        icon={<HashIcon size={16} />}
        value={form.numero}
        onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
        required
      />
      <Select
        label="Propietario"
        icon={<UserIcon size={16} />}
        value={form.propietario_id}
        onChange={(v) => setForm((f) => ({ ...f, propietario_id: v }))}
        required
      >
        <option value="" disabled>
          Selecciona un propietario…
        </option>
        {propietarios.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre_completo}
          </option>
        ))}
      </Select>
      {esAsesor ? (
        <Input
          label="Responsable (a cargo)"
          icon={<IdentificationBadgeIcon size={16} />}
          value={me ? `${me.nombre_completo} (${ROL_LABEL[me.rol]})` : ''}
          readOnly
          disabled
          hint="Quedas asignado automáticamente como responsable."
        />
      ) : (
        <Select
          label="Responsable (a cargo)"
          icon={<IdentificationBadgeIcon size={16} />}
          value={form.responsable_id}
          onChange={(v) => setForm((f) => ({ ...f, responsable_id: v }))}
          required
        >
          <option value="" disabled>
            Selecciona un responsable…
          </option>
          {responsables.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre_completo} ({ROL_LABEL[u.rol]})
            </option>
          ))}
        </Select>
      )}
      <Input
        label="Canon"
        formato="moneda"
        icon={<MoneyIcon size={16} />}
        value={form.canon}
        onChange={(e) => setForm((f) => ({ ...f, canon: e.target.value }))}
        required
      />
      <Input
        label="Día de corte"
        type="number"
        icon={<CalendarDotsIcon size={16} />}
        min={1}
        max={31}
        value={form.dia_corte}
        onChange={(e) => setForm((f) => ({ ...f, dia_corte: e.target.value }))}
        required
      />
      <Select
        label="Asegurado"
        icon={<ShieldCheckIcon size={16} />}
        value={form.asegurado ? '1' : '0'}
        onChange={(v) => setForm((f) => ({ ...f, asegurado: v === '1' }))}
      >
        <option value="1">Sí</option>
        <option value="0">No</option>
      </Select>
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
