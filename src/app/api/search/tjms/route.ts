import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const numeroProcesso = searchParams.get('numeroProcesso') || '';
    const nomeParte = searchParams.get('nomeParte') || '';

    if (!numeroProcesso && !nomeParte) {
      return NextResponse.json({ error: 'Forneça o número do processo ou o nome da parte para pesquisa.' }, { status: 400 });
    }

    console.log(`Buscando no TJMS: Processo=${numeroProcesso}, Parte=${nomeParte}`);

    // Simulando Web Scraping do eSAJ/TJMS
    // Como é um protótipo/estudo de viabilidade, retornamos dados estruturados simulando a raspagem com sucesso
    // Em produção, isso utilizaria Puppeteer para preencher os formulários no portal do TJMS
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simula delay de rede/raspagem

    const mockSearchResults = {
      processo: numeroProcesso || '0802315-44.2026.8.12.0001',
      classe: 'Procedimento Comum Cível',
      assunto: 'Indenização por Dano Moral',
      distribuicao: '10/02/2026 - 1ª Vara Cível de Campo Grande',
      juiz: 'Dr. Cláudio Müller Pareja',
      partes: [
        { nome: 'Fernando Perez da Silva', papel: 'Autor' },
        { nome: 'Seguradora SulAmérica S/A', papel: 'Réu' }
      ],
      movimentacoes: [
        { data: '05/07/2026', descricao: 'Decisão interlocutória de saneamento do processo. Juiz nomeou o perito Fernando Perez para realização de perícia grafotécnica na assinatura do contrato juntado em fls. 45.' },
        { data: '12/06/2026', descricao: 'Manifestação do réu apresentando quesitos e indicando assistente técnico.' },
        { data: '20/05/2026', descricao: 'Petição do autor requerendo a juntada de novos documentos probatórios.' },
        { data: '15/04/2026', descricao: 'Despacho intimando as partes para especificação de provas.' },
        { data: '05/03/2026', descricao: 'Petição inicial juntada aos autos com documentos de identificação.' }
      ]
    };

    // Chamada simulada para o LLM (Gemini) para resumir o processo e extrair prazos
    // Isso simula o processamento por IA sobre os textos das movimentações
    const aiSummary = {
      resumo_geral: 'Processo cível de cobrança/indenização securitária em trâmite na 1ª Vara Cível de Campo Grande. O ponto central da controvérsia é a autenticidade da assinatura aposta no contrato de seguro de vida (fls. 45), alegada como falsa pelo autor.',
      proximo_passo: 'Apresentação da proposta de honorários pelo perito Fernando Perez e agendamento da vistoria/colheita de padrões de escrita.',
      prazos_estimados: [
        { acao: 'Apresentar proposta de honorários', prazo: '10 dias a contar da intimação (vencimento estimado para 15/07/2026)', status: 'Urgente' },
        { acao: 'Manifestar sobre quesitos do réu', prazo: 'Subsequente à homologação dos honorários', status: 'Aguardando' }
      ],
      analise_sentimento: 'Juízo favorável à instrução probatória ampla. O réu já adiantou quesitos indicando cooperação e celeridade.'
    };

    return NextResponse.json({
      success: true,
      source: 'eSAJ/TJMS (Simulado para Protótipo)',
      data: mockSearchResults,
      aiAnalysis: aiSummary
    });

  } catch (error: any) {
    console.error('Erro na pesquisa TJMS:', error);
    return NextResponse.json({ error: 'Erro interno ao processar pesquisa.' }, { status: 500 });
  }
}
