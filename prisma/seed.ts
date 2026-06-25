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
  
  // 2.1 Administrador
  const adminCargo = await prisma.cargo.upsert({
    where: { nome: 'Administrador' },
    update: { descricao: 'Controle total sobre todos os recursos e configurações do escritório.' },
    create: {
      nome: 'Administrador',
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

  console.log('Semeadura concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro na semeadura do banco de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
