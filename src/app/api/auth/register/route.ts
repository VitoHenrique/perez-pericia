import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { nome, email, senha, role } = await request.json();

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: 'Nome, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    const existingUser = await prisma.usuario.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado.' },
        { status: 400 }
      );
    }

    const senha_hash = await hashPassword(senha);

    const userCount = await prisma.usuario.count();
    const finalRole = userCount === 0 ? 'admin' : (role || 'perito');

    const user = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        email: emailLower,
        senha_hash,
        role: finalRole as any,
      },
    });

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
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
