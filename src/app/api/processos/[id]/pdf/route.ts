import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const processo = await prisma.processo.findUnique({
      where: { id },
      include: {
        honorarios: true,
        documentos: true,
        vara: {
          include: {
            comarca: {
              include: {
                estado: true
              }
            }
          }
        },
        comarca: {
          include: {
            estado: true
          }
        },
        usuario: true
      }
    });

    if (!processo) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 });
    }

    // Criar documento PDF
    const doc = new PDFDocument({ margin: 40 });

    // Coletar buffers de dados do PDF
    const chunks: any[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
    });

    // --- CONTEÚDO DO PDF ---
    // Paleta de Cores "Coursue"
    const roxoPrimario = '#6B46C1';
    const roxoClaro = '#A78BFA';
    const cinzaEscuro = '#1A202C';
    const cinzaMedio = '#4A5568';
    const cinzaClaro = '#E2E8F0';

    // Cabeçalho Principal
    doc.fillColor(roxoPrimario).fontSize(20).text('PEREZ PERÍCIA', { align: 'center', characterSpacing: 1 });
    doc.fillColor(cinzaMedio).fontSize(8).text('GESTÃO DE PROCESSOS E LAUDOS JUDICIAIS', { align: 'center', characterSpacing: 1.5 });
    doc.moveDown(1.5);

    // Linha divisória elegante
    doc.strokeColor(cinzaClaro).lineWidth(1).moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown(1.5);

    // Detalhes do Processo (Grid)
    doc.fillColor(roxoPrimario).fontSize(12).text('1. Informações Gerais', { underline: true });
    doc.moveDown(0.5);

    doc.fillColor(cinzaMedio).fontSize(10);
    doc.text(`Número do Processo: `, { continued: true }).fillColor(cinzaEscuro).text(processo.numero_processo);
    doc.fillColor(cinzaMedio).text(`Tipo de Perícia: `, { continued: true }).fillColor(cinzaEscuro).text(
      processo.tipo_pericia === 'GRAFOTECNICA' ? 'Grafotécnica' :
      processo.tipo_pericia === 'PAPILOSCOPICA' ? 'Papiloscópica' :
      processo.tipo_pericia === 'ACIDENTE_TRANSITO' ? 'Acidente de Trânsito' :
      processo.tipo_pericia === 'DIGITAL' ? 'Digital' : processo.tipo_pericia
    );
    doc.fillColor(cinzaMedio).text(`Detalhe: `, { continued: true }).fillColor(cinzaEscuro).text(
      processo.subtipo_pericia === 'assinatura_eletronica' ? 'Assinatura Eletrônica' : 'Grafo (Manuscrito)'
    );
    doc.fillColor(cinzaMedio).text(`Origem: `, { continued: true }).fillColor(cinzaEscuro).text(
      processo.origem === 'pesquisa_dje' ? 'DJE' : 'Nomeação Judicial'
    );
    doc.fillColor(cinzaMedio).text(`Status Atual: `, { continued: true }).fillColor(cinzaEscuro).text(
      processo.status === 'nomeacao_judicial' ? 'Nomeação Judicial' :
      processo.status === 'pesquisa_dje' ? 'Pesquisa DJE' :
      processo.status === 'aguardando_doc' ? 'Aguardando Documentação' :
      processo.status === 'diligencia' ? 'Diligência / Vistoria' :
      processo.status === 'confeccao_envelope' ? 'Confecção de Envelope' :
      processo.status === 'estimativa_honorarios' ? 'Estimativa de Honorários' :
      processo.status === 'elaboracao' ? 'Elaboração de Laudo' :
      processo.status === 'revisao' ? 'Revisão do Laudo' :
      processo.status === 'concluido' ? 'Concluído' : processo.status
    );
    doc.moveDown(1.5);

    // Seção Geográfica
    doc.fillColor(roxoPrimario).fontSize(12).text('2. Localização Judiciária', { underline: true });
    doc.moveDown(0.5);

    if (processo.vara && processo.comarca) {
      doc.fillColor(cinzaMedio).fontSize(10);
      doc.text(`Estado: `, { continued: true }).fillColor(cinzaEscuro).text(processo.comarca.estado.nome);
      doc.fillColor(cinzaMedio).text(`Comarca: `, { continued: true }).fillColor(cinzaEscuro).text(processo.comarca.nome);
      doc.fillColor(cinzaMedio).text(`Vara: `, { continued: true }).fillColor(cinzaEscuro).text(processo.vara.nome);
    } else {
      doc.fillColor(cinzaMedio).fontSize(10);
      doc.text(`Vara e Comarca (Legado): `, { continued: true }).fillColor(cinzaEscuro).text(processo.vara_comarca || 'Não especificada');
    }
    doc.moveDown(1.5);

    // Datas importantes
    doc.fillColor(roxoPrimario).fontSize(12).text('3. Cronograma', { underline: true });
    doc.moveDown(0.5);

    const formatDate = (date: Date) => new Date(date).toLocaleDateString('pt-BR');
    doc.fillColor(cinzaMedio).fontSize(10);
    doc.text(`Data da Nomeação: `, { continued: true }).fillColor(cinzaEscuro).text(formatDate(processo.data_nomeacao));
    doc.fillColor(cinzaMedio).text(`Prazo Limite de Entrega: `, { continued: true }).fillColor(cinzaEscuro).text(formatDate(processo.prazo_entrega));
    doc.moveDown(1.5);

    // Financeiro
    doc.fillColor(roxoPrimario).fontSize(12).text('4. Honorários', { underline: true });
    doc.moveDown(0.5);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const honorario = processo.honorarios[0];

    if (honorario) {
      const pendente = honorario.valor_total - honorario.valor_recebido;
      doc.fillColor(cinzaMedio).fontSize(10);
      doc.text(`Valor Homologado: `, { continued: true }).fillColor(cinzaEscuro).text(formatCurrency(honorario.valor_total));
      doc.fillColor(cinzaMedio).text(`Valor Recebido: `, { continued: true }).fillColor(cinzaEscuro).text(formatCurrency(honorario.valor_recebido));
      doc.fillColor(cinzaMedio).text(`Saldo Devedor: `, { continued: true }).fillColor(cinzaEscuro).text(formatCurrency(pendente));
      doc.fillColor(cinzaMedio).text(`Vencimento: `, { continued: true }).fillColor(cinzaEscuro).text(formatDate(honorario.data_vencimento));
      doc.fillColor(cinzaMedio).text(`Status de Pagamento: `, { continued: true }).fillColor(cinzaEscuro).text(honorario.status_pagamento.toUpperCase());
    } else {
      doc.fillColor(cinzaEscuro).fontSize(10).text('Nenhum honorário lançado para este processo.');
    }
    doc.moveDown(1.5);

    // Descrições e Resumos
    if (processo.relatorio_pesquisa) {
      doc.fillColor(roxoPrimario).fontSize(12).text('5. Relatório de Pesquisa (DJE)', { underline: true });
      doc.moveDown(0.5);
      doc.fillColor(cinzaEscuro).fontSize(10).text(processo.relatorio_pesquisa, { align: 'justify' });
      doc.moveDown(1.5);
    }

    if (processo.descricao) {
      doc.fillColor(roxoPrimario).fontSize(12).text('6. Resumo Técnico / Observações', { underline: true });
      doc.moveDown(0.5);
      doc.fillColor(cinzaEscuro).fontSize(10).text(processo.descricao, { align: 'justify' });
      doc.moveDown(1.5);
    }

    // Imagens (Assinatura e Envelope)
    if (processo.imagemAssinaturaUrl || processo.imagemEnvelopeUrl) {
      doc.addPage();
      doc.fillColor(roxoPrimario).fontSize(14).text('Imagens Anexadas (Assinatura e Envelope)', { align: 'center' });
      doc.moveDown(1.5);

      if (processo.imagemAssinaturaUrl) {
        doc.fillColor(roxoPrimario).fontSize(11).text('Assinatura Digital / Manuscrita:');
        doc.moveDown(0.5);
        
        let signatureImage: Buffer | string | null = null;
        if (processo.imagemAssinaturaUrl.startsWith('data:')) {
          try {
            const base64Parts = processo.imagemAssinaturaUrl.split(';base64,');
            if (base64Parts.length === 2) {
              signatureImage = Buffer.from(base64Parts[1], 'base64');
            }
          } catch (e) {
            console.error('Erro ao converter base64 da assinatura:', e);
          }
        } else {
          try {
            const signatureLocalPath = path.join(process.cwd(), 'public', processo.imagemAssinaturaUrl);
            if (fs.existsSync(signatureLocalPath)) {
              signatureImage = signatureLocalPath;
            }
          } catch (e) {
            console.error('Erro ao verificar arquivo da assinatura:', e);
          }
        }

        if (signatureImage) {
          try {
            doc.image(signatureImage, { fit: [250, 150], align: 'center' });
            doc.moveDown(2);
          } catch (imgError) {
            console.error('Erro ao renderizar imagem da assinatura no PDF:', imgError);
            doc.fillColor(cinzaMedio).text('Erro ao processar imagem de assinatura.');
            doc.moveDown(2);
          }
        } else {
          doc.fillColor(cinzaMedio).text('Imagem de assinatura não disponível.');
          doc.moveDown(1);
        }
      }

      if (processo.imagemEnvelopeUrl) {
        doc.fillColor(roxoPrimario).fontSize(11).text('Imagem do Envelope:');
        doc.moveDown(0.5);

        let envelopeImage: Buffer | string | null = null;
        if (processo.imagemEnvelopeUrl.startsWith('data:')) {
          try {
            const base64Parts = processo.imagemEnvelopeUrl.split(';base64,');
            if (base64Parts.length === 2) {
              envelopeImage = Buffer.from(base64Parts[1], 'base64');
            }
          } catch (e) {
            console.error('Erro ao converter base64 do envelope:', e);
          }
        } else {
          try {
            const envelopeLocalPath = path.join(process.cwd(), 'public', processo.imagemEnvelopeUrl);
            if (fs.existsSync(envelopeLocalPath)) {
              envelopeImage = envelopeLocalPath;
            }
          } catch (e) {
            console.error('Erro ao verificar arquivo do envelope:', e);
          }
        }

        if (envelopeImage) {
          try {
            doc.image(envelopeImage, { fit: [250, 150], align: 'center' });
          } catch (imgError) {
            console.error('Erro ao renderizar imagem do envelope no PDF:', imgError);
            doc.fillColor(cinzaMedio).text('Erro ao processar imagem do envelope.');
          }
        } else {
          doc.fillColor(cinzaMedio).text('Imagem de envelope não disponível.');
        }
      }
    }

    // Finalizar documento
    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="processo-${processo.numero_processo}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('Erro ao gerar PDF do processo:', error);
    return NextResponse.json({ error: 'Erro ao gerar arquivo PDF.' }, { status: 500 });
  }
}
