import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const processo = await prisma.processo.findUnique({
      where: { id },
      include: {
        honorarios: true,
        documentos: true,
        usuario: {
          select: {
            nome: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!processo) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 });
    }

    if (user.role !== 'admin' && processo.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json({ success: true, processo });
  } catch (error: any) {
    console.error('Erro ao buscar processo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

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

    const processo = await prisma.processo.findUnique({
      where: { id },
    });

    if (!processo) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 });
    }

    if (user.role !== 'admin' && processo.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const {
      numero_processo,
      vara_comarca,
      tipo_pericia,
      status,
      data_nomeacao,
      prazo_entrega,
      descricao,
      origem,
      subtipo_pericia,
      relatorio_pesquisa,
    } = body;

    const updatedData: any = {};
    if (numero_processo !== undefined) updatedData.numero_processo = numero_processo;
    if (vara_comarca !== undefined) updatedData.vara_comarca = vara_comarca;
    if (tipo_pericia !== undefined) updatedData.tipo_pericia = tipo_pericia;
    if (status !== undefined) updatedData.status = status;
    if (data_nomeacao !== undefined) updatedData.data_nomeacao = new Date(data_nomeacao);
    if (prazo_entrega !== undefined) updatedData.prazo_entrega = new Date(prazo_entrega);
    if (descricao !== undefined) updatedData.descricao = descricao;
    if (origem !== undefined) updatedData.origem = origem;
    if (subtipo_pericia !== undefined) updatedData.subtipo_pericia = subtipo_pericia;
    if (relatorio_pesquisa !== undefined) updatedData.relatorio_pesquisa = relatorio_pesquisa;

    const updatedProcesso = await prisma.processo.update({
      where: { id },
      data: updatedData,
      include: {
        honorarios: true,
        documentos: true,
      },
    });

    const statusChanged = status !== undefined && status !== processo.status;
    await logActivity({
      userId: user.id,
      action: statusChanged ? 'MOVED' : 'UPDATED',
      entityType: 'Processo',
      entityId: updatedProcesso.id,
      details: {
        numero_processo: updatedProcesso.numero_processo,
        status_anterior: processo.status,
        status_novo: updatedProcesso.status,
        status_mudou: statusChanged,
        campos_alterados: Object.keys(updatedData),
      },
    });

    return NextResponse.json({ success: true, processo: updatedProcesso });
  } catch (error: any) {
    console.error('Erro ao atualizar processo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const processo = await prisma.processo.findUnique({
      where: { id },
    });

    if (!processo) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 });
    }

    if (user.role !== 'admin' && processo.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await prisma.processo.delete({
      where: { id },
    });

    await logActivity({
      userId: user.id,
      action: 'DELETED',
      entityType: 'Processo',
      entityId: id,
      details: {
        numero_processo: processo.numero_processo,
        vara_comarca: processo.vara_comarca,
      },
    });

    return NextResponse.json({ success: true, message: 'Processo deletado com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao deletar processo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
