'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  ChatCircleTextIcon,
  EnvelopeIcon,
  FloppyDiskIcon,
  IdentificationCardIcon,
  LockIcon,
  RobotIcon,
  ShieldCheckIcon,
  UserIcon,
  XIcon,
} from '@phosphor-icons/react';
import { ROL_LABEL, type ActualizarUsuario, type Rol, type Usuario } from '@/lib/api';
import { useUsuariosTodas, useUsuarioMutations } from '@/lib/queries';
import { Button, Input, Loading, Select, useDrawerClose } from '@/app/components/ui';

const ROLES: Rol[] = ['asesor', 'admin', 'super_admin'];

/**
 * Crear (sin usuarioId) o editar (con usuarioId). En edición espera a que el
 * usuario esté en cache antes de montar el form con estado, así los campos se
 * pre-llenan también en carga directa por URL.
 */
export function UsuarioForm({ usuarioId }: { usuarioId?: string }) {
  const { data: usuarios = [], isLoading } = useUsuariosTodas();

  if (!usuarioId) return <FormInner />; // crear

  const usuario = usuarios.find((u) => u.id === usuarioId);
  if (isLoading || (!usuario && usuarios.length === 0)) return <Loading full />;
  if (!usuario) return <p className="text-sm text-red-600">Usuario no encontrado.</p>;
  return <FormInner usuario={usuario} />;
}

function FormInner({ usuario }: { usuario?: Usuario }) {
  const cerrar = useDrawerClose();
  const editar = !!usuario;
  const { crear, actualizar } = useUsuarioMutations();

  const [form, setForm] = useState({
    usuario: usuario?.usuario ?? '',
    email: usuario?.email ?? '',
    password: '',
    nombre_completo: usuario?.nombre_completo ?? '',
    rol: (usuario?.rol ?? 'asesor') as Rol,
    telegram_bot_token: '',
    telegram_chat_id: usuario?.telegram_chat_id ?? '',
    recibe_todos_pagos: usuario?.recibe_todos_pagos ?? false,
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (editar) {
      const dto: ActualizarUsuario = {
        usuario: form.usuario,
        email: form.email,
        nombre_completo: form.nombre_completo,
        rol: form.rol,
        telegram_chat_id: form.telegram_chat_id,
        recibe_todos_pagos: form.recibe_todos_pagos,
      };
      if (form.password) dto.password = form.password;
      // Token write-only: solo se envía si el usuario escribió uno nuevo.
      if (form.telegram_bot_token) dto.telegram_bot_token = form.telegram_bot_token;
      try {
        await actualizar.mutateAsync({ id: usuario!.id, dto });
        toast.success('Usuario actualizado');
        cerrar();
      } catch (err) {
        toast.error((err as Error).message);
      }
    } else {
      try {
        await crear.mutateAsync(form);
        toast.success('Usuario creado');
        cerrar();
      } catch (err) {
        toast.error((err as Error).message);
      }
    }
  }

  const guardando = crear.isPending || actualizar.isPending;

  return (
    <form onSubmit={guardar} className="space-y-4">
      <Input label="Nombre completo" icon={<IdentificationCardIcon size={16} />} value={form.nombre_completo} onChange={set('nombre_completo')} required />
      <Input label="Usuario" icon={<UserIcon size={16} />} value={form.usuario} onChange={set('usuario')} required minLength={3} />
      <Input label="Email" type="email" icon={<EnvelopeIcon size={16} />} value={form.email} onChange={set('email')} required />
      <Select
        label="Rol"
        icon={<ShieldCheckIcon size={16} />}
        value={form.rol}
        onChange={(v) => setForm((f) => ({ ...f, rol: v as Rol }))}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROL_LABEL[r]}
          </option>
        ))}
      </Select>
      <Input
        label={editar ? 'Nueva contraseña (vacío = no cambiar)' : 'Contraseña'}
        type="password"
        icon={<LockIcon size={16} />}
        value={form.password}
        onChange={set('password')}
        minLength={editar ? undefined : 8}
        required={!editar}
        placeholder={editar ? '••••••••' : 'mínimo 8 caracteres'}
      />

      <div className="border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Notificaciones (Telegram)
        </p>
        <div className="space-y-4">
          <Input
            label="Token del bot"
            type="password"
            icon={<RobotIcon size={16} />}
            value={form.telegram_bot_token}
            onChange={set('telegram_bot_token')}
            placeholder={editar && usuario?.tiene_bot ? '•••••• (configurado)' : 'Token del bot'}
            hint={editar && usuario?.tiene_bot ? 'Déjalo vacío para no cambiarlo.' : undefined}
            autoComplete="off"
          />
          <Input
            label="Chat ID"
            icon={<ChatCircleTextIcon size={16} />}
            inputMode="numeric"
            value={form.telegram_chat_id}
            onChange={set('telegram_chat_id')}
            placeholder="Chat de Telegram"
          />
          <Select
            label="Recibe todos los pagos (admin)"
            icon={<ShieldCheckIcon size={16} />}
            value={form.recibe_todos_pagos ? '1' : '0'}
            onChange={(v) => setForm((f) => ({ ...f, recibe_todos_pagos: v === '1' }))}
          >
            <option value="0">No</option>
            <option value="1">Sí</option>
          </Select>
        </div>
      </div>

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
