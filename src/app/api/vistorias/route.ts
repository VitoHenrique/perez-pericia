import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!hasPermission(user, ['vistorias.view'])) {
      return NextResponse.json({ error: 'Acesso negado: sem permissão para visualizar vistorias' }, { status: 403 });
    }

    const whereClause: any = {};
    if (user.role !== 'admin') {
      whereClause.processo = {
        usuario_id: user.id
      };
    }

    const vistorias = await prisma.vistoria.findMany({
      where: whereClause,
      include: {
        processo: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: [
        { data: 'asc' },
        { hora: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, vistorias });
  } catch (error: any) {
    console.error('Erro ao buscar vistorias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!hasPermission(user, ['vistorias.create'])) {
      return NextResponse.json({ error: 'Acesso negado: sem permissão para agendar vistorias' }, { status: 403 });
    }

    const { processoId, data, hora, endereco, contato } = await req.json();

    if (!processoId || !data || !hora || !endereco) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // Verify process ownership
    const processo = await prisma.processo.findUnique({
      where: { id: processoId }
    });

    if (!processo) {
      return NextResponse.json({ error: 'Processo não encontrado.' }, { status: 404 });
    }

    if (user.role !== 'admin' && processo.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const newVistoria = await prisma.vistoria.create({
      data: {
        processo_id: processoId,
        data,
        hora,
        endereco,
        contato: contato || '',
      }
    });

    await logActivity({
      userId: user.id,
      action: 'CREATED',
      entityType: 'Vistoria',
      entityId: newVistoria.id,
      details: {
        data: newVistoria.data,
        hora: newVistoria.hora,
        numero_processo: processo.numero_processo,
      },
    });

    return NextResponse.json({ success: true, vistoria: newVistoria });
  } catch (error: any) {
    console.error('Erro ao agendar vistoria:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
