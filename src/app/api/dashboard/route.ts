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
      whereClause.usuario_id = user.id;
    }

    const processos = await prisma.processo.findMany({
      where: whereClause,
      include: {
        honorarios: true,
      },
    });

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(now.getDate() + 15);

    let ativos = 0;
    let concluidos = 0;
    let suspensos = 0;

    let prazos3dias = 0;
    let prazos7dias = 0;
    let prazos15dias = 0;

    const statusCounts: { [key: string]: number } = {
      backlog: 0,
      aguardando_doc: 0,
      diligencia: 0,
      elaboracao: 0,
      revisao: 0,
      concluido: 0,
    };

    let totalHonorariosAReceber = 0;
    let totalHonorariosRecebidos = 0;

    const monthlyDataMap: { [key: string]: { recebido: number; previsto: number } } = {};
    const monthsName = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const key = `${monthsName[d.getMonth()]}/${d.getFullYear().toString().substring(2)}`;
      monthlyDataMap[key] = { recebido: 0, previsto: 0 };
    }

    processos.forEach((p: any) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;

      if (p.status === 'concluido') {
        concluidos++;
      } else {
        ativos++;
        if (p.status === 'backlog' || p.status === 'aguardando_doc') {
          suspensos++;
        }

        const prazo = new Date(p.prazo_entrega);
        if (prazo >= now && prazo <= threeDaysFromNow) {
          prazos3dias++;
        } else if (prazo > threeDaysFromNow && prazo <= sevenDaysFromNow) {
          prazos7dias++;
        } else if (prazo > sevenDaysFromNow && prazo <= fifteenDaysFromNow) {
          prazos15dias++;
        }
      }

      p.honorarios.forEach((h: any) => {
        totalHonorariosRecebidos += h.valor_recebido;
        totalHonorariosAReceber += (h.valor_total - h.valor_recebido);

        const venc = new Date(h.data_vencimento);
        const key = `${monthsName[venc.getMonth()]}/${venc.getFullYear().toString().substring(2)}`;
        
        if (monthlyDataMap[key] !== undefined) {
          monthlyDataMap[key].recebido += h.valor_recebido;
          monthlyDataMap[key].previsto += h.valor_total;
        }
      });
    });

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const processosDesteMes = processos.filter((p: any) => {
      const prazo = new Date(p.prazo_entrega);
      return prazo.getMonth() === currentMonth && prazo.getFullYear() === currentYear;
    });

    let conclusaoMensal = 0;
    if (processosDesteMes.length > 0) {
      const concluidosDesteMes = processosDesteMes.filter((p: any) => p.status === 'concluido').length;
      conclusaoMensal = Math.round((concluidosDesteMes / processosDesteMes.length) * 100);
    } else if (processos.length > 0) {
      conclusaoMensal = Math.round((concluidos / processos.length) * 100);
    } else {
      conclusaoMensal = 0;
    }

    const processosPorStatus = Object.keys(statusCounts).map((k) => ({
      name: k === 'backlog' ? 'Entrada' : 
            k === 'aguardando_doc' ? 'Aguardando Doc.' :
            k === 'diligencia' ? 'Diligência' :
            k === 'elaboracao' ? 'Elaboração' :
            k === 'revisao' ? 'Revisão' : 'Concluído',
      value: statusCounts[k],
      key: k,
    }));

    const financeiroMensal = Object.keys(monthlyDataMap).map((k) => ({
      name: k,
      recebido: monthlyDataMap[k].recebido,
      previsto: monthlyDataMap[k].previsto,
    }));

    const team = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      kpis: {
        totalProcessos: processos.length,
        ativos,
        concluidos,
        suspensos,
        prazos3dias,
        prazos7dias,
        prazos15dias,
        conclusaoMensal,
        financeiro: {
          aReceber: totalHonorariosAReceber,
          recebido: totalHonorariosRecebidos,
          total: totalHonorariosRecebidos + totalHonorariosAReceber,
        }
      },
      charts: {
        processosPorStatus,
        financeiroMensal,
      },
      team
    });

  } catch (error: any) {
    console.error('Erro no dashboard API:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
