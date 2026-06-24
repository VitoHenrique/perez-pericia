import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        data_criacao: true,
        _count: {
          select: { processos: true },
        },
      },
      orderBy: {
        data_criacao: 'desc',
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Erro na API administrativa de usuários:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
