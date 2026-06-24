import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    const user = await prisma.usuario.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 400 }
      );
    }

    const isMatch = await comparePassword(senha, user.senha_hash);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 400 }
      );
    }

    const token = await signJWT({ id: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
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
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
