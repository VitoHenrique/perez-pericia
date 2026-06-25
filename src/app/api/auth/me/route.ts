import { NextResponse } from 'next/server';
import { getCurrentUser, signJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Erro ao obter usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { nome, email } = await request.json();

    if (!nome || !email) {
      return NextResponse.json(
        { error: 'Nome e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Verifica se o e-mail já está em uso por outro usuário
    const existingUser = await prisma.usuario.findFirst({
      where: {
        email: emailLower,
        NOT: {
          id: user.id,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está sendo utilizado por outro profissional.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: user.id },
      data: {
        nome,
        email: emailLower,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        data_criacao: true,
      },
    });

    // Assina um novo token JWT com os dados atualizados
    const token = await signJWT({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role });

    const response = NextResponse.json({
      success: true,
      user: updatedUser,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
