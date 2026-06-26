import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!hasPermission(user, ['honorarios.edit'])) {
      return NextResponse.json({ error: 'Acesso negado: sem permissão para editar honorários' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { valor_total, valor_recebido, status_pagamento, data_vencimento } = body;

    const honorario = await prisma.honorario.findUnique({
      where: { id },
      include: {
        processo: true,
      },
    });

    if (!honorario) {
      return NextResponse.json({ error: 'Honorário não encontrado' }, { status: 404 });
    }

    if (!hasPermission(user, ['data.view_all']) && honorario.processo.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const updatedData: any = {};
    if (valor_total !== undefined) updatedData.valor_total = parseFloat(valor_total);
    if (valor_recebido !== undefined) updatedData.valor_recebido = parseFloat(valor_recebido);
    if (status_pagamento !== undefined) updatedData.status_pagamento = status_pagamento;
    if (data_vencimento !== undefined) updatedData.data_vencimento = new Date(data_vencimento);

    const updatedHonorario = await prisma.honorario.update({
      where: { id },
      data: updatedData,
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATED',
      entityType: 'Honorario',
      entityId: updatedHonorario.id,
      details: {
        valor_total: updatedHonorario.valor_total,
        status_pagamento: updatedHonorario.status_pagamento,
        valor_recebido: updatedHonorario.valor_recebido,
        numero_processo: honorario.processo.numero_processo,
        campos_alterados: Object.keys(updatedData),
      },
    });

    return NextResponse.json({ success: true, honorario: updatedHonorario });
  } catch (error: any) {
    console.error('Erro ao atualizar honorário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
