import { ForbiddenException } from '@nestjs/common';
import { ScopeService } from './scope.service';
import { UsuarioActual } from './current-user.decorator';

// Mock de SupabaseService: simula
//   from('apartamentos').select('id').eq('responsable_id', x).eq('estado', true)
// Exige las DOS llamadas .eq() encadenadas y devuelve filas { id }, igual que
// el query real de apartamentoIds. Si el código cambia de tabla/forma, falla.
function supaConIds(ids: string[]) {
  return {
    client: {
      from: (tabla: string) => {
        if (tabla !== 'apartamentos') throw new Error(`tabla inesperada: ${tabla}`);
        return {
          select: (cols: string) => {
            if (cols !== 'id') throw new Error(`columnas inesperadas: ${cols}`);
            return {
              eq: (campo: string) => {
                if (campo !== 'responsable_id') throw new Error(`filtro inesperado: ${campo}`);
                return {
                  eq: async (campo2: string) => {
                    if (campo2 !== 'estado') throw new Error(`filtro inesperado: ${campo2}`);
                    return { data: ids.map((id) => ({ id })), error: null };
                  },
                };
              },
            };
          },
        };
      },
    },
  } as any;
}

const asesor: UsuarioActual = {
  id: 'u-asesor',
  usuario: 'tefa',
  email: 't@e.co',
  nombre_completo: 'Tefa',
  rol: 'asesor',
};
const admin: UsuarioActual = { ...asesor, id: 'u-admin', rol: 'admin' };

describe('ScopeService', () => {
  describe('esAsesor', () => {
    it('true solo para rol asesor', () => {
      const svc = new ScopeService(supaConIds([]));
      expect(svc.esAsesor(asesor)).toBe(true);
      expect(svc.esAsesor(admin)).toBe(false);
      expect(svc.esAsesor(undefined)).toBe(false);
    });
  });

  describe('assertApartamento', () => {
    it('admin/super_admin pasan sin restricción', async () => {
      const svc = new ScopeService(supaConIds([]));
      await expect(svc.assertApartamento(admin, 'apto-x')).resolves.toBeUndefined();
    });

    it('sin usuario (cron/telegram) pasa sin restricción', async () => {
      const svc = new ScopeService(supaConIds([]));
      await expect(svc.assertApartamento(undefined, 'apto-x')).resolves.toBeUndefined();
    });

    it('asesor con el apartamento a cargo pasa', async () => {
      const svc = new ScopeService(supaConIds(['apto-1', 'apto-2']));
      await expect(svc.assertApartamento(asesor, 'apto-1')).resolves.toBeUndefined();
    });

    it('asesor sin el apartamento a cargo recibe 403', async () => {
      const svc = new ScopeService(supaConIds(['apto-1']));
      await expect(svc.assertApartamento(asesor, 'apto-9')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
