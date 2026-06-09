import { FechasService } from './fechas.service';

describe('FechasService', () => {
  const svc = new FechasService();

  describe('fechaCorte (clamp a fin de mes)', () => {
    it('corte=15 → día 15 normal', () => {
      expect(svc.fechaCorte('2026-03', 15)).toBe('2026-03-15');
    });

    it('corte=30 en mes de 31 días', () => {
      expect(svc.fechaCorte('2026-01', 30)).toBe('2026-01-30');
    });

    it('corte=30 en febrero (no existe) → 28', () => {
      expect(svc.fechaCorte('2026-02', 30)).toBe('2026-02-28');
    });

    it('corte=31 en febrero (año no bisiesto 2026) → 28', () => {
      expect(svc.fechaCorte('2026-02', 31)).toBe('2026-02-28');
    });

    it('corte=31 en febrero bisiesto (2028) → 29', () => {
      expect(svc.fechaCorte('2028-02', 31)).toBe('2028-02-29');
    });

    it('corte=31 en abril (30 días) → 30', () => {
      expect(svc.fechaCorte('2026-04', 31)).toBe('2026-04-30');
    });
  });

  describe('fechaLimite (= corte + 5)', () => {
    it('corte=15 mar → 20 mar', () => {
      expect(svc.fechaLimite('2026-03', 15)).toBe('2026-03-20');
    });

    it('corte=30 ene → 04 feb (cambio de mes)', () => {
      expect(svc.fechaLimite('2026-01', 30)).toBe('2026-02-04');
    });

    it('corte=31 feb (→28) → 05 mar (cambio de mes)', () => {
      expect(svc.fechaLimite('2026-02', 31)).toBe('2026-03-05');
    });

    it('corte=30 dic → 04 ene del año siguiente', () => {
      expect(svc.fechaLimite('2026-12', 30)).toBe('2027-01-04');
    });
  });

  describe('debeAlertar (umbral >=, con catch-up)', () => {
    // corte=15 mar → limite 20 mar. diego>=19, admin>=20.
    it('vacío antes de corte+4 (corte 15)', () => {
      expect(svc.debeAlertar('2026-03-18', '2026-03', 15)).toEqual([]);
    });
    it('solo diego el día corte+4 (corte 15)', () => {
      expect(svc.debeAlertar('2026-03-19', '2026-03', 15)).toEqual(['moroso_diego']);
    });
    it('diego+admin desde corte+5 (corte 15)', () => {
      expect(svc.debeAlertar('2026-03-20', '2026-03', 15)).toEqual(['moroso_diego', 'moroso_admin']);
    });
    it('catch-up: día perdido sigue disparando ambos (corte 15)', () => {
      // si el cron no corrió el 19 ni 20, el 21 todavía recupera ambos
      expect(svc.debeAlertar('2026-03-21', '2026-03', 15)).toEqual(['moroso_diego', 'moroso_admin']);
    });

    // corte=30 ene → limite 04 feb (cambio de mes). diego>=03 feb, admin>=04 feb.
    it('cruzando de mes (corte 30)', () => {
      expect(svc.debeAlertar('2026-02-02', '2026-01', 30)).toEqual([]);
      expect(svc.debeAlertar('2026-02-03', '2026-01', 30)).toEqual(['moroso_diego']);
      expect(svc.debeAlertar('2026-02-04', '2026-01', 30)).toEqual(['moroso_diego', 'moroso_admin']);
    });

    // corte=31 feb → limite 05 mar. diego>=04 mar, admin>=05 mar.
    it('corte=31 en feb', () => {
      expect(svc.debeAlertar('2026-03-04', '2026-02', 31)).toEqual(['moroso_diego']);
      expect(svc.debeAlertar('2026-03-05', '2026-02', 31)).toEqual(['moroso_diego', 'moroso_admin']);
    });
  });

  describe('periodosCandidatos / periodoAnterior', () => {
    it('incluye mes de hoy y mes anterior', () => {
      expect(svc.periodosCandidatos('2026-02-04')).toEqual(['2026-02', '2026-01']);
    });
    it('periodoAnterior cruza año', () => {
      expect(svc.periodoAnterior('2026-01')).toBe('2025-12');
    });
  });
});
