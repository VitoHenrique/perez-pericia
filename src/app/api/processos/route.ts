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

    if (!hasPermission(user, ['data.view_all'])) {
      whereClause.usuario_id = user.id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { numero_processo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { vara: { nome: { contains: search, mode: 'insensitive' } } },
        { comarca: { nome: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const processos = await prisma.processo.findMany({
      where: whereClause,
      include: {
        honorarios: true,
        documentos: true,
        vara: {
          include: {
            comarca: {
              include: {
                estado: true
              }
            }
          }
        },
        comarca: {
          include: {
            estado: true
          }
        },
        usuario: {
          select: {
            nome: true,
            email: true,
            role: true,
            foto_url: true,
            cargo: {
              select: {
                nome: true,
              },
            },
          }
        }
      },
      orderBy: {
        prazo_entrega: 'asc',
      },
    });

    const tipoPericiaMap: { [key: string]: string } = {
      GRAFOTECNICA: 'Grafotécnica',
      PAPILOSCOPICA: 'Papiloscópica',
      ACIDENTE_TRANSITO: 'Acidente de Trânsito',
      DIGITAL: 'Digital'
    };

    const mappedProcessos = processos.map((p) => {
      let varaComarcaStr = p.vara_comarca;
      if (p.vara && p.comarca) {
        varaComarcaStr = `${p.vara.nome} de ${p.comarca.nome}/${p.comarca.estado.sigla}`;
      }

      return {
        ...p,
        vara_comarca: varaComarcaStr,
        tipo_pericia: tipoPericiaMap[p.tipo_pericia] || p.tipo_pericia
      };
    });

    return NextResponse.json({ success: true, processos: mappedProcessos });
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
      varaId,
      comarcaId,
      imagemAssinaturaUrl,
      imagemEnvelopeUrl,
    } = body;

    if (!numero_processo || !data_nomeacao || !prazo_entrega) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes.' },
        { status: 400 }
      );
    }

    const mapTipoPericia = (tipo: string): any => {
      const t = (tipo || '').toLowerCase();
      if (t.includes('grafo') || t.includes('grafotecnica')) return 'GRAFOTECNICA';
      if (t.includes('papilo') || t.includes('papiloscopica')) return 'PAPILOSCOPICA';
      if (t.includes('acidente') || t.includes('transito') || t.includes('acidente_transito')) return 'ACIDENTE_TRANSITO';
      if (t.includes('digital')) return 'DIGITAL';
      return 'GRAFOTECNICA';
    };

    const processo = await prisma.processo.create({
      data: {
        usuario_id: user.id,
        numero_processo,
        vara_comarca: vara_comarca || null,
        tipo_pericia: mapTipoPericia(tipo_pericia),
        subtipo_pericia: subtipo_pericia || 'grafo',
        origem: origem || 'nomeacao_judicial',
        status: status || 'nomeacao_judicial',
        data_nomeacao: new Date(data_nomeacao),
        prazo_entrega: new Date(prazo_entrega),
        descricao: descricao || '',
        relatorio_pesquisa: relatorio_pesquisa || null,
        varaId: varaId || null,
        comarcaId: comarcaId || null,
        imagemAssinaturaUrl: imagemAssinaturaUrl || null,
        imagemEnvelopeUrl: imagemEnvelopeUrl || null,
      },
    });

    await logActivity({
      userId: user.id,
      action: 'CREATED',
      entityType: 'Processo',
      entityId: processo.id,
      details: {
        numero_processo: processo.numero_processo,
        varaId,
        comarcaId,
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
