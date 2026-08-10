import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan, DataSource, In } from 'typeorm';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { SiteVisit } from './entities/site-visit.entity';
import { Book } from '../books/entities/book.entity';
import { CreateVisitDto } from './dto/create-visit.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private visitBuffer: Partial<SiteVisit>[] = [];

  constructor(
    @InjectRepository(SiteVisit)
    private visitRepository: Repository<SiteVisit>,
    private dataSource: DataSource,
  ) {}

  async trackVisit(createVisitDto: CreateVisitDto, ipAddress: string): Promise<void> {
    if (createVisitDto.duration && createVisitDto.duration > 0) {
      // Try to find the initial page load in the buffer to update its duration instead of duplicating
      const existing = this.visitBuffer.find(
        v => v.sessionId === createVisitDto.sessionId && v.pageVisited === createVisitDto.pageVisited && (!v.duration || v.duration === 0)
      );
      if (existing) {
        existing.duration = createVisitDto.duration;
        return;
      } else {
        // The initial visit was already flushed to the database. We must update the database directly to avoid a duplicate row.
        const latestVisit = await this.visitRepository.findOne({
          where: { 
            sessionId: createVisitDto.sessionId, 
            pageVisited: createVisitDto.pageVisited 
          },
          order: { visitedAt: 'DESC' }
        });
        
        if (latestVisit) {
          latestVisit.duration = createVisitDto.duration;
          // We can do an immediate save since it's just an update, or we could buffer it, but save is fine for leave events.
          await this.visitRepository.save(latestVisit);
          return;
        }
      }
    }

    this.visitBuffer.push({
      ...createVisitDto,
      ipAddress,
      visitedAt: new Date(), // Set the timestamp now so it's accurate to the request time
    });
  }

  // Bulk insert visits every 10 seconds to avoid database overload
  @Interval(10000)
  async processVisitBuffer() {
    if (this.visitBuffer.length === 0) return;

    // Take a snapshot of the current buffer and clear it
    const batch = [...this.visitBuffer];
    this.visitBuffer = [];

    try {
      await this.visitRepository.insert(batch);
      // this.logger.debug(`Batch inserted ${batch.length} visits`);
    } catch (error) {
      this.logger.error('Failed to insert visit batch', error);
      // Optional: push back to buffer if insert fails
      // this.visitBuffer.push(...batch);
    }
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [todayVisits, weekVisits, totalVisits] = await Promise.all([
      this.visitRepository.count({
        where: { visitedAt: MoreThanOrEqual(today) },
      }),
      this.visitRepository.count({
        where: { visitedAt: MoreThanOrEqual(oneWeekAgo) },
      }),
      this.visitRepository.count(),
    ]);

    // Get unique sessions today
    const uniqueSessionsToday = await this.visitRepository
      .createQueryBuilder('visit')
      .select('visit.sessionId')
      .where('visit.visitedAt >= :today', { today })
      .groupBy('visit.sessionId')
      .getRawMany();

    return {
      todayVisits,
      weekVisits,
      totalVisits,
      uniqueSessionsToday: uniqueSessionsToday.length,
    };
  }

  async getRecentVisits(limit: number = 100) {
    const visits = await this.visitRepository.find({
      order: {
        visitedAt: 'DESC',
      },
      take: limit,
    });

    const bookIds = new Set<number>();
    const bookMatchRegex = /\/(books|ebook-reader)\/(\d+)/;

    visits.forEach(visit => {
      if (visit.pageVisited) {
        const match = visit.pageVisited.match(bookMatchRegex);
        if (match && match[2]) {
          bookIds.add(parseInt(match[2], 10));
        }
      }
    });

    let booksMap = new Map<number, string>();
    if (bookIds.size > 0) {
      const books = await this.dataSource.getRepository(Book).find({
        where: { id: In(Array.from(bookIds)) },
        select: ['id', 'title'],
      });
      books.forEach(b => booksMap.set(b.id, b.title));
    }

    return visits.map(visit => {
      let resourceTitle = visit.pageVisited;
      if (visit.pageVisited) {
        const match = visit.pageVisited.match(bookMatchRegex);
        if (match && match[2]) {
          const title = booksMap.get(parseInt(match[2], 10));
          if (title) {
            resourceTitle = `Book: ${title}`;
          }
        } else if (visit.pageVisited === '/') {
          resourceTitle = 'Home Page';
        } else if (visit.pageVisited === '/login') {
          resourceTitle = 'Login Page';
        } else if (visit.pageVisited === '/signup') {
          resourceTitle = 'Signup Page';
        } else if (visit.pageVisited === '/profile') {
          resourceTitle = 'User Profile';
        }
      }
      return {
        ...visit,
        resourceTitle,
      };
    });
  }

  // Run automatically every day at midnight to clean up logs older than 30 days
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldVisits() {
    this.logger.log('Running automated cleanup of old site visits...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.visitRepository.delete({
      visitedAt: LessThan(thirtyDaysAgo),
    });

    this.logger.log(`Cleanup complete. Deleted ${result.affected} old visit records.`);
  }
}


