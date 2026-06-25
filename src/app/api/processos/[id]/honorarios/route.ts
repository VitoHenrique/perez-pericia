import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: processoId } = await params;
    const body = await request.json();
    const { valor_total, valor_recebido, status_pagamento, data_vencimento } = body;

    const processo = await prisma.processo.findUnique({
      where: { id: processoId },
    });

    if (!processo) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 });
    }

    if (user.role !== 'admin' && processo.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    if (valor_total === undefined || !data_vencimento) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const honorario = await prisma.honorario.create({
      data: {
        processo_id: processoId,
        valor_total: parseFloat(valor_total),
        valor_recebido: valor_recebido ? parseFloat(valor_recebido) : 0,
        status_pagamento: status_pagamento || 'pendente',
        data_vencimento: new Date(data_vencimento),
      },
    });

    await logActivity({
      userId: user.id,
      action: 'CREATED',
      entityType: 'Honorario',
      entityId: honorario.id,
      details: {
        valor_total: honorario.valor_total,
        numero_processo: processo.numero_processo,
      },
    });

    return NextResponse.json({ success: true, honorario });
  } catch (error: any) {
    console.error('Erro ao adicionar honorário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
