'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BuildingsIcon,
  CalendarBlankIcon,
  CameraIcon,
  HashIcon,
  MoneyIcon,
  ReceiptIcon,
} from '@phosphor-icons/react';
import { api, aptoLabel, periodoActual, type ResultadoOcr } from '@/lib/api';
import { useApartamentosTodos } from '@/lib/queries';
import { Button, Input, Loading, MonthPicker, Select } from '@/app/components/ui';

export default function IngresoPage() {
  const { data: aptos = [] } = useApartamentosTodos();

  const [aptoId, setAptoId] = useState('');
  const [periodo, setPeriodo] = useState(periodoActual());
  const [monto, setMonto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [preview, setPreview] = useState('');
  const [confirmado, setConfirmado] = useState(true);
  const [facturaElectronica, setFacturaElectronica] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!aptoId && aptos[0]) setAptoId(aptos[0].id);
  }, [aptos, aptoId]);

  const ocr = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.postForm<ResultadoOcr>('/pagos/ocr', form);
    },
    onSuccess: (r) => {
      setComprobanteUrl(r.comprobante_url);
      if (r.sugerencia.monto != null) setMonto(String(r.sugerencia.monto));
      if (r.sugerencia.referencia) setReferencia(r.sugerencia.referencia);
      if (r.sugerencia.fecha?.length === 10) setPeriodo(r.sugerencia.fecha.slice(0, 7));
      toast.success('OCR listo. Revisa los datos y confirma.');
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const registrar = useMutation({
    mutationFn: () =>
      api.post('/pagos', {
        apartamento_id: aptoId,
        periodo,
        monto: monto ? Number(monto) : undefined,
        comprobante_url: comprobanteUrl || undefined,
        factura_electronica: facturaElectronica,
        estado: confirmado ? 'confirmado' : 'pendiente',
      }),
    onSuccess: () => {
      toast.success('Pago registrado. Te llegó aviso por Telegram.');
      setMonto('');
      setReferencia('');
      setComprobanteUrl('');
      setFacturaElectronica(false);
      setPreview('');
      if (fileRef.current) fileRef.current.value = '';
    },
    onError: (err) => toast.error((err as Error).message),
  });

  function onImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    ocr.mutate(file);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Registrar pago</h1>
        <p className="text-sm text-slate-500">Sube el comprobante y confirma</p>
      </div>

      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-5 text-center">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onImagen}
          className="hidden"
          id="comprobante"
        />
        <label
          htmlFor="comprobante"
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-700"
        >
          <CameraIcon size={20} /> Tomar foto / subir comprobante
        </label>
        {ocr.isPending && <Loading label="Leyendo comprobante" className="mt-2" />}
        {preview && <img src={preview} alt="comprobante" className="mx-auto mt-3 max-h-48 rounded-lg" />}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          registrar.mutate();
        }}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <Select
          label="Apartamento"
          icon={<BuildingsIcon size={16} />}
          value={aptoId}
          onChange={setAptoId}
          required
        >
          {aptos.map((a) => (
            <option key={a.id} value={a.id}>
              {aptoLabel(a)}
            </option>
          ))}
        </Select>

        <MonthPicker
          label="Periodo"
          icon={<CalendarBlankIcon size={16} />}
          value={periodo}
          onChange={setPeriodo}
        />

        <Input
          label={`Monto${monto ? ' (OCR)' : ''}`}
          formato="moneda"
          icon={<MoneyIcon size={16} />}
          placeholder="1.500.000"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />

        <Input
          label="Referencia"
          icon={<HashIcon size={16} />}
          placeholder="N° comprobante"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={facturaElectronica}
            onChange={(e) => setFacturaElectronica(e.target.checked)}
          />
          Factura electrónica
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={confirmado}
            onChange={(e) => setConfirmado(e.target.checked)}
          />
          Marcar como confirmado (ya validé el comprobante)
        </label>

        <Button
          type="submit"
          loading={registrar.isPending}
          loadingText="Registrando…"
          icon={<ReceiptIcon size={16} />}
          className="w-full"
        >
          Registrar pago
        </Button>
      </form>
    </div>
  );
}
