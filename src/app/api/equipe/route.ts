import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const members = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        foto_url: true,
        data_criacao: true,
        _count: {
          select: { processos: true },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    console.error('Erro na API de equipe:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
