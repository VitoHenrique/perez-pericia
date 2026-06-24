import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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
    } = body;

    if (!numero_processo || !vara_comarca || !tipo_pericia || !data_nomeacao || !prazo_entrega) {
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
        tipo_pericia,
        status: status || 'backlog',
        data_nomeacao: new Date(data_nomeacao),
        prazo_entrega: new Date(prazo_entrega),
        descricao: descricao || '',
      },
    });

    if (valor_total !== undefined && valor_total !== null && !isNaN(parseFloat(valor_total))) {
      await prisma.honorario.create({
        data: {
          processo_id: processo.id,
          valor_total: parseFloat(valor_total),
          valor_recebido: 0,
          status_pagamento: 'pendente',
          data_vencimento: data_vencimento_honorario ? new Date(data_vencimento_honorario) : new Date(prazo_entrega),
        },
      });
    }

    return NextResponse.json({ success: true, processo });
  } catch (error: any) {
    console.error('Erro ao criar processo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
