/**
 * Crea (o actualiza) el super_admin inicial. Ejecuta UNA vez tras aplicar
 * la migración 0003, antes de cortar al guard JWT — sin esto, lockout total.
 *
 * Uso (desde backend/):
 *   SUPERADMIN_USUARIO=diego \
 *   SUPERADMIN_EMAIL=diego.londono@medwork.io \
 *   SUPERADMIN_PASSWORD='una-clave-fuerte' \
 *   SUPERADMIN_NOMBRE='Diego Londoño' \
 *   pnpm ts-node scripts/crear-superadmin.ts
 *
 * Lee SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY del entorno (.env).
 * No imprime el password. Idempotente: si el usuario ya existe, lo actualiza.
 */
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const usuario = process.env.SUPERADMIN_USUARIO;
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const nombre = process.env.SUPERADMIN_NOMBRE ?? usuario;

  if (!usuario || !email || !password) {
    throw new Error(
      'Faltan variables: SUPERADMIN_USUARIO, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD',
    );
  }
  if (password.length < 8) {
    throw new Error('El password debe tener al menos 8 caracteres.');
  }

  const supa = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } },
  );

  const hash = await bcrypt.hash(password, 12);

  // Upsert manual por usuario (lower) para no duplicar.
  const { data: existente } = await supa
    .from('usuarios')
    .select('id')
    .ilike('usuario', usuario)
    .maybeSingle();

  if (existente) {
    const { error } = await supa
      .from('usuarios')
      .update({ email, password: hash, nombre_completo: nombre, rol: 'super_admin', estado: true })
      .eq('id', existente.id);
    if (error) throw new Error(error.message);
    console.log(`✓ super_admin actualizado: ${usuario}`);
  } else {
    const { error } = await supa.from('usuarios').insert({
      usuario,
      email,
      password: hash,
      nombre_completo: nombre,
      rol: 'super_admin',
      estado: true,
    });
    if (error) throw new Error(error.message);
    console.log(`✓ super_admin creado: ${usuario}`);
  }
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
