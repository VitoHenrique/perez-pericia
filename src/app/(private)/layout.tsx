import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { prisma } from '@/lib/prisma';

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Guard: if user is null, redirect to login
  if (!user) {
    redirect('/login');
  }

  const team = await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
    },
    orderBy: {
      nome: 'asc',
    },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <Sidebar user={user} team={team} />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar Info & Settings */}
        <Topbar userName={user.nome} />

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
