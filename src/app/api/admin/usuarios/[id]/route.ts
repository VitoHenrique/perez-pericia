import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { cargoId } = body;

    if (!cargoId) {
      return NextResponse.json({ error: 'Cargo é obrigatório.' }, { status: 400 });
    }

    const cargo = await prisma.cargo.findUnique({
      where: { id: cargoId },
    });

    if (!cargo) {
      return NextResponse.json({ error: 'Cargo não encontrado.' }, { status: 404 });
    }

    // Mapear o enum legado baseado no nome do novo cargo
    let resolvedLegacyRole: any = 'perito';
    const cargoNomeLower = cargo.nome.toLowerCase();
    if (cargoNomeLower.includes('admin')) {
      resolvedLegacyRole = 'admin';
    } else if (cargoNomeLower.includes('assistente')) {
      resolvedLegacyRole = 'assistente';
    }

    if (id === user.id && resolvedLegacyRole !== 'admin') {
      return NextResponse.json({ error: 'Você não pode revogar seus próprios privilégios de administrador.' }, { status: 400 });
    }

    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: { 
        cargoId,
        role: resolvedLegacyRole 
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        cargoId: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Erro ao atualizar papel do usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    if (id === user.id) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta.' }, { status: 400 });
    }

    await prisma.usuario.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Usuário removido com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
