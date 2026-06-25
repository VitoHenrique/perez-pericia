import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const roles = await prisma.cargo.findMany({
      include: {
        permissoes: {
          include: {
            permissao: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    console.error('Erro ao listar cargos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nome, descricao, permissoesIds } = body;

    if (!nome) {
      return NextResponse.json({ error: 'Nome do cargo é obrigatório.' }, { status: 400 });
    }

    // Criar o Cargo e associar as permissões
    const cargo = await prisma.cargo.create({
      data: {
        nome,
        descricao: descricao || '',
        permissoes: {
          create: (permissoesIds || []).map((pId: string) => ({
            permissaoId: pId,
          })),
        },
      },
      include: {
        permissoes: {
          include: {
            permissao: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, role: cargo });
  } catch (error: any) {
    console.error('Erro ao criar cargo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
