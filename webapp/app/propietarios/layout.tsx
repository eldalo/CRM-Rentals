import { PropietariosListView } from './_components/PropietariosListView';

export default function PropietariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PropietariosListView />
      {children}
    </>
  );
}
