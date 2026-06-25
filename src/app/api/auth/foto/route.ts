import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'O arquivo enviado deve ser uma imagem.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Criar diretório se não existir
    await mkdir(uploadDir, { recursive: true });

    // Nome único para evitar conflitos
    const extension = file.name.split('.').pop() || 'png';
    const uniqueFilename = `perfil-${user.id}-${Date.now()}.${extension}`;
    const filePath = join(uploadDir, uniqueFilename);
    
    await writeFile(filePath, buffer);

    const url = `/uploads/${uniqueFilename}`;

    // Atualizar no banco de dados
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        foto_url: url,
      },
    });

    return NextResponse.json({ success: true, foto_url: url });
  } catch (error: any) {
    console.error('Erro no upload de foto de perfil:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor.', 
      stack: error.stack 
    }, { status: 500 });
  }
}
