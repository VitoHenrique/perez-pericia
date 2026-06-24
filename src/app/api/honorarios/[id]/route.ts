import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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

    if (user.role !== 'admin' && honorario.processo.usuario_id !== user.id) {
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

    return NextResponse.json({ success: true, honorario: updatedHonorario });
  } catch (error: any) {
    console.error('Erro ao atualizar honorário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
