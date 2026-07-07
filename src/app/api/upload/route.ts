import { NextResponse } from 'next/server';
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    try {
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const filePath = join(uploadDir, uniqueFilename);
      
      await writeFile(filePath, buffer);

      const url = `/uploads/${uniqueFilename}`;
      return NextResponse.json({ success: true, url });
    } catch (fsError) {
      console.warn('Filesystem write failed, falling back to base64 Data URL:', fsError);
      return NextResponse.json({ success: true, url: dataUrl });
    }
  } catch (error: any) {
    console.error('Erro no upload de arquivo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
