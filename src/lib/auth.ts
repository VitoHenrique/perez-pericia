import { jwtVerify, SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-perez-pericia';
const key = new TextEncoder().encode(JWT_SECRET);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signJWT(payload: any): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload || !payload.id) return null;

    const user = await prisma.usuario.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        cargoId: true,
        cargo: {
          select: {
            id: true,
            nome: true,
            permissoes: {
              select: {
                permissao: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
        foto_url: true,
        data_criacao: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

export function hasPermission(user: any, requiredPermissions: string[]): boolean {
  if (!user) return false;
  
  // Administrador has bypass (always has all permissions)
  if (user.role === 'admin' || user.cargo?.nome === 'Administrador') {
    return true;
  }

  if (!user.cargo || !user.cargo.permissoes) return false;
  
  const userPermissions = user.cargo.permissoes.map(
    (cp: any) => cp.permissao.nome
  );
  
  return requiredPermissions.every(perm => userPermissions.includes(perm));
}

export async function getUserWithPermissions(userId: string) {
  return prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      cargoId: true,
      cargo: {
        select: {
          id: true,
          nome: true,
          permissoes: {
            select: {
              permissao: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

