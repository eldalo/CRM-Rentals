import { UnidadesListView } from './_components/UnidadesListView';

export default function UnidadesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UnidadesListView />
      {children}
    </>
  );
}
