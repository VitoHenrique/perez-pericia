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
    const comarcaId = searchParams.get('comarcaId');

    // Se comarcaId for fornecido, retorna apenas as varas daquela comarca
    if (comarcaId) {
      const varas = await prisma.vara.findMany({
        where: { comarcaId },
        orderBy: { nome: 'asc' }
      });
      return NextResponse.json({ success: true, varas });
    }

    // Caso contrário, retorna todos os estados com suas respectivas comarcas
    const estados = await prisma.estado.findMany({
      include: {
        comarcas: {
          orderBy: { nome: 'asc' }
        }
      },
      orderBy: { nome: 'asc' }
    });

    return NextResponse.json({ success: true, estados });
  } catch (error: any) {
    console.error('Erro na API de Geografia:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
