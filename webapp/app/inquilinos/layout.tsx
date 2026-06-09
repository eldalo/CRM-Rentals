import { InquilinosListView } from './_components/InquilinosListView';

export default function InquilinosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InquilinosListView />
      {children}
    </>
  );
}
