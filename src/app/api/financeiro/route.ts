import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const whereClause: any = {};
    if (user.role !== 'admin') {
      whereClause.processo = {
        usuario_id: user.id,
      };
    }

    const honorarios = await prisma.honorario.findMany({
      where: whereClause,
      include: {
        processo: {
          select: {
            numero_processo: true,
            vara_comarca: true,
            tipo_pericia: true,
            status: true,
          },
        },
      },
      orderBy: {
        data_vencimento: 'asc',
      },
    });

    let totalPrevisto = 0;
    let totalRecebido = 0;

    honorarios.forEach((h: any) => {
      totalPrevisto += h.valor_total;
      totalRecebido += h.valor_recebido;
    });

    return NextResponse.json({
      success: true,
      honorarios,
      kpis: {
        totalPrevisto,
        totalRecebido,
        totalPendente: totalPrevisto - totalRecebido,
      },
    });
  } catch (error: any) {
    console.error('Erro na API financeira:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
