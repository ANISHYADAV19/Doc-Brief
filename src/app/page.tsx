import { Header } from '@/components/Header';
import { Workspace } from '@/components/Workspace';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header />
      <Workspace />
    </div>
  );
}
