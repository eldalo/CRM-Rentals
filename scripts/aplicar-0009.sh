#!/usr/bin/env bash
# Aplica la migración 0009 (rename roles + puesto) y siembra usuarios en el
# Supabase remoto.
#
# Uso:
#   PGPASSWORD='tu-password-de-postgres' bash scripts/aplicar-0009.sh
#
# El password está en: Supabase → Project Settings → Database → Database password.
# (Si lo olvidaste, ahí mismo puedes resetearlo.)

set -euo pipefail

PROJECT_REF="uqwpbmafmpeycgbubabj"
HOST="db.${PROJECT_REF}.supabase.co"
PORT="5432"
DBUSER="postgres"
DBNAME="postgres"

if [[ -z "${PGPASSWORD:-}" ]]; then
  read -rsp "Password de Postgres (Supabase): " PGPASSWORD
  echo
  export PGPASSWORD
fi

# sslmode=require: Supabase exige TLS.
PGURL="postgresql://${DBUSER}@${HOST}:${PORT}/${DBNAME}?sslmode=require"

# Rutas relativas a este script (funciona desde cualquier cwd).
DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "▶ Aplicando migración 0009 (rename roles + enum puesto)…"
psql "$PGURL" -v ON_ERROR_STOP=1 -f "$DIR/supabase/migrations/0009_roles_puesto.sql"

echo "▶ Sembrando usuarios iniciales (idempotente)…"
psql "$PGURL" -v ON_ERROR_STOP=1 -f "$DIR/supabase/seed_usuarios.sql"

echo "▶ Verificación: roles y puestos actuales"
psql "$PGURL" -v ON_ERROR_STOP=1 -c \
  "select usuario, rol, puesto, estado from usuarios order by rol, usuario;"

echo "✓ Listo. Migración y seed aplicados."
