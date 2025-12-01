import { Table } from '@/components/table/Table';
import { NotificationDashboard } from '@/components/table/NotificationDashboard';

export default function Home() {
  return (
    <main className="w-full min-h-screen flex flex-col gap-4 p-4">
      <Table/>
      <NotificationDashboard/>
    </main>
  );
}
