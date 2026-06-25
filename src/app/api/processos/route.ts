import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!hasPermission(user, ['processos.view'])) {
      return NextResponse.json({ error: 'Acesso negado: sem permissão para visualizar processos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    const whereClause: any = {};

    if (user.role !== 'admin') {
      whereClause.usuario_id = user.id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { numero_processo: { contains: search } },
        { vara_comarca: { contains: search } },
        { tipo_pericia: { contains: search } },
        { descricao: { contains: search } },
      ];
    }

    const processos = await prisma.processo.findMany({
      where: whereClause,
      include: {
        honorarios: true,
        documentos: true,
        usuario: {
          select: {
            nome: true,
            email: true,
            role: true,
            foto_url: true,
          }
        }
      },
      orderBy: {
        prazo_entrega: 'asc',
      },
    });

    return NextResponse.json({ success: true, processos });
  } catch (error: any) {
    console.error('Erro ao listar processos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!hasPermission(user, ['processos.create'])) {
      return NextResponse.json({ error: 'Acesso negado: sem permissão para cadastrar processos' }, { status: 403 });
    }

    const body = await request.json();
    const {
      numero_processo,
      vara_comarca,
      tipo_pericia,
      status,
      data_nomeacao,
      prazo_entrega,
      descricao,
      valor_total,
      data_vencimento_honorario,
      origem,
      subtipo_pericia,
      relatorio_pesquisa,
    } = body;

    const resolvedTipoPericia = tipo_pericia || 'Grafotécnica';

    if (!numero_processo || !vara_comarca || !resolvedTipoPericia || !data_nomeacao || !prazo_entrega) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes.' },
        { status: 400 }
      );
    }

    const processo = await prisma.processo.create({
      data: {
        usuario_id: user.id,
        numero_processo,
        vara_comarca,
        tipo_pericia: resolvedTipoPericia,
        subtipo_pericia: subtipo_pericia || 'grafo',
        origem: origem || 'nomeacao_judicial',
        status: status || 'nomeacao_judicial',
        data_nomeacao: new Date(data_nomeacao),
        prazo_entrega: new Date(prazo_entrega),
        descricao: descricao || '',
        relatorio_pesquisa: relatorio_pesquisa || null,
      },
    });

    await logActivity({
      userId: user.id,
      action: 'CREATED',
      entityType: 'Processo',
      entityId: processo.id,
      details: {
        numero_processo: processo.numero_processo,
        vara_comarca: processo.vara_comarca,
      },
    });

    if (valor_total !== undefined && valor_total !== null && !isNaN(parseFloat(valor_total))) {
      const honorario = await prisma.honorario.create({
        data: {
          processo_id: processo.id,
          valor_total: parseFloat(valor_total),
          valor_recebido: 0,
          status_pagamento: 'pendente',
          data_vencimento: data_vencimento_honorario ? new Date(data_vencimento_honorario) : new Date(prazo_entrega),
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
    }

    return NextResponse.json({ success: true, processo });
  } catch (error: any) {
    console.error('Erro ao criar processo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
