import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const permissions = await prisma.permissao.findMany({
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json({ success: true, permissions });
  } catch (error: any) {
    console.error('Erro ao listar permissões:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
