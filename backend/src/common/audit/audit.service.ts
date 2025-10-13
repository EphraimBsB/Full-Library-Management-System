import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

type AuditLogParams = {
  entityType: string;
  entityId?: string | number;
  action: AuditAction;
  oldValue?: any;
  newValue?: any;
  performedBy?: User | string;
  request?: Request;
  reason?: string;
  isSuccessful?: boolean;
  error?: string;
  metadata?: Record<string, any>;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) { }

  private getClientInfo(req?: Request): { ipAddress: string | null; userAgent: string | null } {
    if (!req) return { ipAddress: null, userAgent: null };

    const ipAddress = (req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      (req as any).connection?.socket?.remoteAddress ||
      '') as string;

    const userAgent = (req.headers['user-agent'] || '') as string;

    return {
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    };
  }

  async log({
    entityType,
    entityId,
    action,
    oldValue,
    newValue,
    performedBy,
    request,
    reason,
    isSuccessful = true,
    error,
    metadata,
  }: AuditLogParams): Promise<AuditLog | null> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(request);

      const performedById = typeof performedBy === 'string'
        ? performedBy
        : performedBy?.id;

      // Create a new audit log entity with proper typing
      const auditLog = this.auditLogRepository.create({
        entityType: entityType,
        entityId: entityId ? entityId.toString() : undefined,
        action: action,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
        performedById: performedById || undefined,
        performedBy: typeof performedBy === 'object' ? performedBy : undefined,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        reason: reason || undefined,
        isSuccessful,
        error: error || undefined,
        metadata: metadata || undefined,
      });

      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw to prevent breaking the main operation
      return null;
    }
  }

  async getLogs(
    entityType?: string,
    entityId?: string | number,
    action?: AuditAction,
    startDate?: Date,
    endDate?: Date,
    limit = 100,
    offset = 0,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const query = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.performedBy', 'user')
      .orderBy('log.performedAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (entityType) {
      query.andWhere('log.entityType = :entityType', { entityType });
    }

    if (entityId) {
      query.andWhere('log.entityId = :entityId', { entityId: entityId.toString() });
    }

    if (action) {
      query.andWhere('log.action = :action', { action });
    }

    if (startDate) {
      query.andWhere('log.performedAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('log.performedAt <= :endDate', { endDate });
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async getEntityHistory<T>(
    entityType: string,
    entityId: string | number,
    limit = 100,
    offset = 0,
  ): Promise<{ data: AuditLog[]; total: number }> {
    return this.getLogs(entityType, entityId, undefined, undefined, undefined, limit, offset);
  }

  async getUserActivity(
    userId: string,
    limit = 100,
    offset = 0,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const [data, total] = await this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.performedBy', 'user')
      .where('log.performedById = :userId', { userId })
      .orderBy('log.performedAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return { data, total };
  }
}
