import { ApartamentosListView } from './_components/ApartamentosListView';

export default function ApartamentosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ApartamentosListView />
      {children}
    </>
  );
}
