import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
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

    if (!hasPermission(user, ['processos.view'])) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    const processo = await prisma.processo.findUnique({
      where: { id },
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
          },
        },
      },
    });

    if (!processo) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 });
    }

    if (!hasPermission(user, ['data.view_all']) && processo.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const tipoPericiaMap: { [key: string]: string } = {
      GRAFOTECNICA: 'Grafotécnica',
      PAPILOSCOPICA: 'Papiloscópica',
      ACIDENTE_TRANSITO: 'Acidente de Trânsito',
      DIGITAL: 'Digital'
    };

    let varaComarcaStr = processo.vara_comarca;
    if (processo.vara && processo.comarca) {
      varaComarcaStr = `${processo.vara.nome} de ${processo.comarca.nome}/${processo.comarca.estado.sigla}`;
    }

    const mappedProcesso = {
      ...processo,
      vara_comarca: varaComarcaStr,
      tipo_pericia: tipoPericiaMap[processo.tipo_pericia] || processo.tipo_pericia
    };

    return NextResponse.json({ success: true, processo: mappedProcesso });
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

    if (!hasPermission(user, ['processos.edit'])) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const processo = await prisma.processo.findUnique({
      where: { id },
    });

    if (!processo) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 });
    }

    if (!hasPermission(user, ['data.view_all']) && processo.usuario_id !== user.id) {
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
      varaId,
      comarcaId,
      imagemAssinaturaUrl,
      imagemEnvelopeUrl,
    } = body;

    const mapTipoPericia = (tipo: string): any => {
      const t = (tipo || '').toLowerCase();
      if (t.includes('grafo') || t.includes('grafotecnica')) return 'GRAFOTECNICA';
      if (t.includes('papilo') || t.includes('papiloscopica')) return 'PAPILOSCOPICA';
      if (t.includes('acidente') || t.includes('transito') || t.includes('acidente_transito')) return 'ACIDENTE_TRANSITO';
      if (t.includes('digital')) return 'DIGITAL';
      return 'GRAFOTECNICA';
    };

    const updatedData: any = {};
    if (numero_processo !== undefined) updatedData.numero_processo = numero_processo;
    if (vara_comarca !== undefined) updatedData.vara_comarca = vara_comarca;
    if (tipo_pericia !== undefined) updatedData.tipo_pericia = mapTipoPericia(tipo_pericia);
    if (status !== undefined) updatedData.status = status;
    if (data_nomeacao !== undefined) updatedData.data_nomeacao = new Date(data_nomeacao);
    if (prazo_entrega !== undefined) updatedData.prazo_entrega = new Date(prazo_entrega);
    if (descricao !== undefined) updatedData.descricao = descricao;
    if (origem !== undefined) updatedData.origem = origem;
    if (subtipo_pericia !== undefined) updatedData.subtipo_pericia = subtipo_pericia;
    if (relatorio_pesquisa !== undefined) updatedData.relatorio_pesquisa = relatorio_pesquisa;
    if (varaId !== undefined) updatedData.varaId = varaId || null;
    if (comarcaId !== undefined) updatedData.comarcaId = comarcaId || null;
    if (imagemAssinaturaUrl !== undefined) updatedData.imagemAssinaturaUrl = imagemAssinaturaUrl || null;
    if (imagemEnvelopeUrl !== undefined) updatedData.imagemEnvelopeUrl = imagemEnvelopeUrl || null;

    const updatedProcesso = await prisma.processo.update({
      where: { id },
      data: updatedData,
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

    const tipoPericiaMap: { [key: string]: string } = {
      GRAFOTECNICA: 'Grafotécnica',
      PAPILOSCOPICA: 'Papiloscópica',
      ACIDENTE_TRANSITO: 'Acidente de Trânsito',
      DIGITAL: 'Digital'
    };

    let varaComarcaStr = updatedProcesso.vara_comarca;
    if (updatedProcesso.vara && updatedProcesso.comarca) {
      varaComarcaStr = `${updatedProcesso.vara.nome} de ${updatedProcesso.comarca.nome}/${updatedProcesso.comarca.estado.sigla}`;
    }

    const mappedUpdatedProcesso = {
      ...updatedProcesso,
      vara_comarca: varaComarcaStr,
      tipo_pericia: tipoPericiaMap[updatedProcesso.tipo_pericia] || updatedProcesso.tipo_pericia
    };

    return NextResponse.json({ success: true, processo: mappedUpdatedProcesso });
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

    if (!hasPermission(user, ['processos.delete'])) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    const processo = await prisma.processo.findUnique({
      where: { id },
    });

    if (!processo) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 });
    }

    if (!hasPermission(user, ['data.view_all']) && processo.usuario_id !== user.id) {
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
