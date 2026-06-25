import { prisma } from './prisma';

export interface LogActivityParams {
  userId: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'MOVED' | 'LOGIN' | 'LOGOUT';
  entityType: 'Processo' | 'Honorario' | 'Usuario' | 'Vistoria';
  entityId: string;
  details?: Record<string, any>;
}

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  details,
}: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details || {},
      },
    });
  } catch (error) {
    console.error('Erro ao registrar log de atividade:', error);
  }
}
