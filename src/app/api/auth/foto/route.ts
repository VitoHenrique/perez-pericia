import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

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
    
    // Converte a imagem para Base64 Data URL para salvar diretamente no banco de dados,
    // resolvendo o erro de EROFS (sistema de arquivos somente leitura) na Vercel.
    const base64Image = buffer.toString('base64');
    const url = `data:${file.type};base64,${base64Image}`;

    // Atualizar no banco de dados
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        foto_url: url,
      },
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATED',
      entityType: 'Usuario',
      entityId: user.id,
      details: {
        foto_url_atualizada: true,
        nome: user.nome,
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
