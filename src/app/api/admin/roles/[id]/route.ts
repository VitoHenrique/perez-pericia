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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nome, descricao, permissoesIds } = body;

    if (!nome) {
      return NextResponse.json({ error: 'Nome do cargo é obrigatório.' }, { status: 400 });
    }

    const existingCargo = await prisma.cargo.findUnique({
      where: { id },
    });

    if (!existingCargo) {
      return NextResponse.json({ error: 'Cargo não encontrado.' }, { status: 404 });
    }

    // Não permitir renomear o cargo de Administrador padrão para evitar problemas de sistema
    if (existingCargo.nome === 'Administrador' && nome !== 'Administrador') {
      return NextResponse.json({ error: 'Não é permitido renomear o cargo de Administrador.' }, { status: 400 });
    }

    // Executar atualização em transação
    const updatedCargo = await prisma.$transaction(async (tx) => {
      // 1. Atualizar dados básicos
      const cargo = await tx.cargo.update({
        where: { id },
        data: {
          nome,
          descricao: descricao || '',
        },
      });

      // 2. Deletar permissões antigas
      await tx.cargoPermissao.deleteMany({
        where: { cargoId: id },
      });

      // 3. Criar novas permissões
      if (permissoesIds && permissoesIds.length > 0) {
        await tx.cargoPermissao.createMany({
          data: permissoesIds.map((pId: string) => ({
            cargoId: id,
            permissaoId: pId,
          })),
        });
      }

      return cargo;
    });

    // Buscar com as novas relações
    const cargoWithRelations = await prisma.cargo.findUnique({
      where: { id: updatedCargo.id },
      include: {
        permissoes: {
          include: {
            permissao: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, role: cargoWithRelations });
  } catch (error: any) {
    console.error('Erro ao atualizar cargo:', error);
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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const cargo = await prisma.cargo.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usuarios: true },
        },
      },
    });

    if (!cargo) {
      return NextResponse.json({ error: 'Cargo não encontrado.' }, { status: 404 });
    }

    // Bloquear exclusões críticas
    if (cargo.nome === 'Administrador' || cargo.nome === 'Perito' || cargo.nome === 'Assistente') {
      return NextResponse.json({ error: 'Cargos do sistema não podem ser excluídos.' }, { status: 400 });
    }

    if (cargo._count.usuarios > 0) {
      return NextResponse.json({
        error: `Existem ${cargo._count.usuarios} usuários associados a este cargo. Redirecione os usuários antes de excluir.`,
      }, { status: 400 });
    }

    await prisma.cargo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Cargo excluído com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao excluir cargo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
