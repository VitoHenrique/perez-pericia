import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const whereClause: any = {
      timestamp: {
        gte: twentyFourHoursAgo,
      },
    };

    if (!hasPermission(user, ['data.view_all'])) {
      // Obter IDs dos processos pertencentes ao usuário para cruzar referências de logs
      const userProcessIds = await prisma.processo.findMany({
        where: { usuario_id: user.id },
        select: { id: true },
      }).then(list => list.map(p => p.id));

      const userHonorarioIds = await prisma.honorario.findMany({
        where: { processo: { usuario_id: user.id } },
        select: { id: true },
      }).then(list => list.map(h => h.id));

      const userVistoriaIds = await prisma.vistoria.findMany({
        where: { processo: { usuario_id: user.id } },
        select: { id: true },
      }).then(list => list.map(v => v.id));

      whereClause.OR = [
        { userId: user.id },
        {
          entityType: 'Processo',
          entityId: { in: userProcessIds },
        },
        {
          entityType: 'Honorario',
          entityId: { in: userHonorarioIds },
        },
        {
          entityType: 'Vistoria',
          entityId: { in: userVistoriaIds },
        },
      ];
    }

    const notifications = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            foto_url: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
