import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!hasPermission(user, ['vistorias.delete'])) {
      return NextResponse.json({ error: 'Acesso negado: sem permissão para excluir vistorias' }, { status: 403 });
    }

    const { id } = await params;

    const vistoria = await prisma.vistoria.findUnique({
      where: { id },
      include: {
        processo: true
      }
    });

    if (!vistoria) {
      return NextResponse.json({ error: 'Vistoria não encontrada.' }, { status: 404 });
    }

    if (user.role !== 'admin' && vistoria.processo.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    await prisma.vistoria.delete({
      where: { id }
    });

    await logActivity({
      userId: user.id,
      action: 'DELETED',
      entityType: 'Vistoria',
      entityId: id,
      details: {
        data: vistoria.data,
        hora: vistoria.hora,
        numero_processo: vistoria.processo.numero_processo,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir vistoria:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
