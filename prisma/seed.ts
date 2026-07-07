import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Iniciando semeadura do banco de dados (RBAC)...');

  // 1. Criar permissões padrões
  const permissionsData = [
    // Processos
    { name: 'processos.view', description: 'Visualizar processos e laudos' },
    { name: 'processos.create', description: 'Cadastrar novos processos' },
    { name: 'processos.edit', description: 'Editar dados de processos' },
    { name: 'processos.delete', description: 'Excluir processos do sistema' },
    
    // Financeiro
    { name: 'honorarios.view', description: 'Visualizar levantamentos e honorários' },
    { name: 'honorarios.create', description: 'Adicionar novos honorários' },
    { name: 'honorarios.edit', description: 'Dar baixa ou alterar honorários' },
    { name: 'honorarios.delete', description: 'Excluir lançamentos de honorários' },

    // Vistorias
    { name: 'vistorias.view', description: 'Visualizar agenda e diligências' },
    { name: 'vistorias.create', description: 'Agendar vistorias em campo' },
    { name: 'vistorias.delete', description: 'Remover agendamento de vistoria' },

    // Administração
    { name: 'admin.view', description: 'Acesso geral ao painel de administração' },
    { name: 'cargos.manage', description: 'Gerenciar cargos e permissões do escritório' },
    { name: 'data.view_all', description: 'Visualizar dados de todos os colaboradores (processos e agenda)' },
  ];

  console.log('Criando permissões...');
  const permissoesMap: { [name: string]: any } = {};

  for (const perm of permissionsData) {
    const createdPerm = await prisma.permissao.upsert({
      where: { nome: perm.name },
      update: { descricao: perm.description },
      create: { nome: perm.name, descricao: perm.description },
    });
    permissoesMap[perm.name] = createdPerm;
  }

  // 2. Criar cargos (Roles)
  console.log('Criando cargos...');
  
  // 2.1 Desenvolvedor (antigo Administrador)
  const existingAdmin = await prisma.cargo.findUnique({
    where: { nome: 'Administrador' },
  });
  if (existingAdmin) {
    await prisma.cargo.update({
      where: { nome: 'Administrador' },
      data: { nome: 'Desenvolvedor' },
    });
  }

  const adminCargo = await prisma.cargo.upsert({
    where: { nome: 'Desenvolvedor' },
    update: { descricao: 'Controle total sobre todos os recursos e configurações do escritório.' },
    create: {
      nome: 'Desenvolvedor',
      descricao: 'Controle total sobre todos os recursos e configurações do escritório.',
    },
  });

  // Associar TODAS as permissões ao Administrador
  for (const perm of Object.values(permissoesMap)) {
    await prisma.cargoPermissao.upsert({
      where: {
        cargoId_permissaoId: {
          cargoId: adminCargo.id,
          permissaoId: perm.id,
        },
      },
      update: {},
      create: {
        cargoId: adminCargo.id,
        permissaoId: perm.id,
      },
    });
  }

  // 2.2 Perito
  const peritoCargo = await prisma.cargo.upsert({
    where: { nome: 'Perito' },
    update: { descricao: 'Responsável pela execução técnica das perícias e agendamento de vistorias.' },
    create: {
      nome: 'Perito',
      descricao: 'Responsável pela execução técnica das perícias e agendamento de vistorias.',
    },
  });

  // Permissões do Perito
  const peritoPerms = [
    'processos.view', 'processos.create', 'processos.edit', 'processos.delete',
    'honorarios.view', 'honorarios.create', 'honorarios.edit',
    'vistorias.view', 'vistorias.create', 'vistorias.delete'
  ];
  for (const name of peritoPerms) {
    const perm = permissoesMap[name];
    if (perm) {
      await prisma.cargoPermissao.upsert({
        where: {
          cargoId_permissaoId: {
            cargoId: peritoCargo.id,
            permissaoId: perm.id,
          },
        },
        update: {},
        create: {
          cargoId: peritoCargo.id,
          permissaoId: perm.id,
        },
      });
    }
  }

  // 2.3 Assistente
  const assistenteCargo = await prisma.cargo.upsert({
    where: { nome: 'Assistente' },
    update: { descricao: 'Auxilia na elaboração de laudos e visualização de prazos.' },
    create: {
      nome: 'Assistente',
      descricao: 'Auxilia na elaboração de laudos e visualização de prazos.',
    },
  });

  // Permissões do Assistente
  const assistentePerms = [
    'processos.view', 'processos.create', 'processos.edit',
    'vistorias.view'
  ];
  for (const name of assistentePerms) {
    const perm = permissoesMap[name];
    if (perm) {
      await prisma.cargoPermissao.upsert({
        where: {
          cargoId_permissaoId: {
            cargoId: assistenteCargo.id,
            permissaoId: perm.id,
          },
        },
        update: {},
        create: {
          cargoId: assistenteCargo.id,
          permissaoId: perm.id,
        },
      });
    }
  }

  // 3. Associar usuários existentes aos novos cargos
  console.log('Vinculando usuários existentes aos novos cargos...');
  const users = await prisma.usuario.findMany();

  for (const user of users) {
    let targetCargoId = '';
    
    if (user.role === 'admin') {
      targetCargoId = adminCargo.id;
    } else if (user.role === 'perito') {
      targetCargoId = peritoCargo.id;
    } else if (user.role === 'assistente') {
      targetCargoId = assistenteCargo.id;
    }

    if (targetCargoId && (!user.cargoId || user.cargoId !== targetCargoId)) {
      await prisma.usuario.update({
        where: { id: user.id },
        data: { cargoId: targetCargoId },
      });
      console.log(`Usuário ${user.nome} associado ao cargo ${user.role}`);
    }
  }

  // 4. Semeadura de Dados Geográficos (Estados, Comarcas e Varas)
  console.log('Iniciando semeadura de dados geográficos...');

  const estadosData = [
    {
      nome: 'São Paulo',
      sigla: 'SP',
      comarcas: [
        'São Paulo', 'Campinas', 'Guarulhos', 'São Bernardo do Campo', 'Santo André',
        'Osasco', 'São José dos Campos', 'Ribeirão Preto', 'Sorocaba', 'Mauá',
        'São José do Rio Preto', 'Mogi das Cruzes', 'Santos', 'Diadema', 'Jundiaí',
        'Piracicaba', 'Bauru', 'Itaquaquecetuba', 'Franca', 'Carapicuíba'
      ]
    },
    {
      nome: 'Paraná',
      sigla: 'PR',
      comarcas: [
        'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel',
        'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá',
        'Araucária', 'Toledo', 'Apucarana', 'Pinhais', 'Campo Largo'
      ]
    },
    {
      nome: 'Mato Grosso do Sul',
      sigla: 'MS',
      comarcas: [
        'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã',
        'Sidrolândia', 'Naviraí', 'Nova Andradina', 'Aquidauana', 'Maracaju'
      ]
    },
    {
      nome: 'Goiás',
      sigla: 'GO',
      comarcas: [
        'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia',
        'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Senador Canedo', 'Catalão'
      ]
    }
  ];

  for (const est of estadosData) {
    console.log(`Semeando estado ${est.nome}...`);
    const estado = await prisma.estado.upsert({
      where: { sigla: est.sigla },
      update: { nome: est.nome },
      create: { nome: est.nome, sigla: est.sigla }
    });

    for (const comNome of est.comarcas) {
      const comarca = await prisma.comarca.upsert({
        where: {
          nome_estadoId: {
            nome: comNome,
            estadoId: estado.id
          }
        },
        update: {},
        create: {
          nome: comNome,
          estadoId: estado.id
        }
      });

      // Gerar 30 varas para a comarca
      // Vamos verificar se já existem varas para esta comarca para não reinserir
      const existingVarasCount = await prisma.vara.count({
        where: { comarcaId: comarca.id }
      });

      if (existingVarasCount < 30) {
        console.log(`Gerando 30 varas cíveis para a comarca de ${comNome}...`);
        const varasToCreate = Array.from({ length: 30 }, (_, i) => ({
          nome: `${i + 1}ª Vara Cível`,
          comarcaId: comarca.id
        }));

        await prisma.vara.createMany({
          data: varasToCreate,
          skipDuplicates: true
        });
      }
    }
  }

  // 5. Migração de dados de Processos (mapeando vara_comarca antiga para vara e comarca estruturadas)
  console.log('Migrando processos existentes para o novo esquema geográfico estruturado...');
  const processos = await prisma.processo.findMany();
  
  // Mapeador de tipo_pericia de string para enum
  const mapTipoPericia = (tipo: string): any => {
    const t = (tipo || '').toLowerCase();
    if (t.includes('grafo')) return 'GRAFOTECNICA';
    if (t.includes('papilo')) return 'PAPILOSCOPICA';
    if (t.includes('acidente') || t.includes('transito')) return 'ACIDENTE_TRANSITO';
    if (t.includes('digital')) return 'DIGITAL';
    return 'GRAFOTECNICA';
  };

  // Carrega todas as comarcas com suas varas para fazer correspondência na memória
  const allComarcas = await prisma.comarca.findMany({
    include: { varas: true }
  });

  for (const proc of processos) {
    let matchedComarca: any = null;
    let matchedVara: any = null;

    if (proc.vara_comarca) {
      const textToSearch = proc.vara_comarca.toLowerCase();
      // Encontra a comarca no texto do campo antigo
      for (const comarca of allComarcas) {
        if (textToSearch.includes(comarca.nome.toLowerCase())) {
          matchedComarca = comarca;
          break;
        }
      }

      // Se encontrou comarca, tenta achar o número da vara (ex: "3ª Vara" ou "Vara 3")
      if (matchedComarca) {
        const numberMatch = proc.vara_comarca.match(/(\d+)/);
        const varaNumber = numberMatch ? parseInt(numberMatch[1]) : 1;
        matchedVara = matchedComarca.varas.find((v: any) => v.nome.startsWith(`${varaNumber}ª`)) || matchedComarca.varas[0];
      }
    }

    // Se nenhuma comarca foi identificada, associa a Curitiba/PR (ou a primeira cadastrada) como fallback
    if (!matchedComarca) {
      matchedComarca = allComarcas.find(c => c.nome === 'Curitiba') || allComarcas[0];
      matchedVara = matchedComarca?.varas[0] || null;
    }

    await prisma.processo.update({
      where: { id: proc.id },
      data: {
        comarcaId: matchedComarca ? matchedComarca.id : undefined,
        varaId: matchedVara ? matchedVara.id : undefined,
        tipo_pericia: mapTipoPericia(proc.tipo_pericia)
      }
    });
    console.log(`Processo ${proc.numero_processo} migrado para Comarca: ${matchedComarca?.nome}, Vara: ${matchedVara?.nome}`);
  }

  console.log('Semeadura e migração concluídas com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro na semeadura do banco de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
