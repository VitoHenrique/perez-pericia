import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas Administradores ou quem tem permissão para ver tudo pode emitir relatórios de atividade
    if (!hasPermission(user, ['admin.view']) && !hasPermission(user, ['data.view_all'])) {
      return NextResponse.json({ error: 'Acesso negado: permissões insuficientes.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const anoStr = searchParams.get('ano');
    const mesStr = searchParams.get('mes');

    if (!anoStr || !mesStr) {
      return NextResponse.json({ error: 'Parâmetros ano e mes são obrigatórios.' }, { status: 400 });
    }

    const ano = parseInt(anoStr);
    const mes = parseInt(mesStr);

    if (isNaN(ano) || isNaN(mes) || mes < 1 || mes > 12) {
      return NextResponse.json({ error: 'Parâmetros de período inválidos.' }, { status: 400 });
    }

    // Calcula o início e fim do mês
    const startDate = new Date(ano, mes - 1, 1);
    const endDate = new Date(ano, mes, 1);

    // Busca os registros de logs
    const logs = await prisma.activityLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        user: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Formata o CSV (com cabeçalho UTF-8 BOM para compatibilidade com Excel)
    const BOM = '\uFEFF';
    let csvContent = 'Data/Hora,Usuário,E-mail,Ação,Tipo de Entidade,ID da Entidade,Detalhes\n';

    for (const log of logs) {
      const dataHora = log.timestamp.toISOString();
      const nomeUsuario = log.user?.nome || 'Sistema';
      const emailUsuario = log.user?.email || 'N/A';
      const acao = log.action;
      const entidade = log.entityType;
      const idEntidade = log.entityId;
      
      const detalhesRaw = log.details ? JSON.stringify(log.details) : '';
      const detalhesSanitizado = detalhesRaw.replace(/"/g, '""');

      csvContent += `"${dataHora}","${nomeUsuario}","${emailUsuario}","${acao}","${entidade}","${idEntidade}","${detalhesSanitizado}"\n`;
    }

    return new NextResponse(BOM + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-atividades-${ano}-${mes}.csv"`,
      },
    });

  } catch (error: any) {
    console.error('Erro ao gerar relatório mensal:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
