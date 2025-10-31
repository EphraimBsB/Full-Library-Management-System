import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { BookInhouseUsage, InhouseUsageStatus } from '../entities/book-inhouse-usage.entity';
import { Book } from '../entities/book.entity';
import { User } from '../../users/entities/user.entity';
import { BookCopy } from '../entities/book-copy.entity';
import { StartInhouseUsageDto, InhouseUsageResponseDto } from '../dto/inhouse-usage.dto';

@Injectable()
export class InhouseUsageService {
  constructor(
    @InjectRepository(BookInhouseUsage)
    private readonly inhouseUsageRepository: Repository<BookInhouseUsage>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookCopy)
    private readonly bookCopyRepository: Repository<BookCopy>,
  ) { }

  async startUsage(
    userId: string,
    startUsageDto: StartInhouseUsageDto,
  ): Promise<InhouseUsageResponseDto> {
    const { bookId, copyId } = startUsageDto;
    const startedAt = new Date();

    // Check if user has any active sessions
    const activeSession = await this.inhouseUsageRepository.findOne({
      where: {
        user: { id: userId },
        status: InhouseUsageStatus.ACTIVE
      }
    });

    if (activeSession) {
      throw new ForbiddenException('You already have an active in-house usage session');
    }

    // Verify book exists
    const book = await this.bookRepository.findOne({
      where: { id: Number(bookId) }
    });
    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    // Verify copy exists if provided
    let copy: BookCopy | null = null;
    if (copyId) {
      copy = await this.bookCopyRepository.findOne({
        where: {
          id: Number(copyId),
          book: { id: Number(bookId) }
        }
      });
      if (!copy) {
        throw new NotFoundException(`Copy with ID ${copyId} not found for this book`);
      }
    }

    // Create new in-house usage record
    const usage = new BookInhouseUsage();
    usage.book = book;

    // Create a minimal user object with just the ID
    const user = new User();
    user.id = userId;
    usage.user = user;

    if (copy) {
      usage.copy = copy;
    }
    usage.startedAt = startedAt;

    const savedUsage = await this.inhouseUsageRepository.save(usage);
    return this.mapToResponseDto(savedUsage);
  }

  async endUsage(
    usageId: string,
    userId: string,
    isForced = false,
  ): Promise<InhouseUsageResponseDto> {
    const usage = await this.inhouseUsageRepository.findOne({
      where: { id: usageId, ...(isForced ? {} : { user: { id: userId } }) },
      relations: ['copy.book', 'user', 'copy']
    });

    if (!usage) {
      throw new NotFoundException('In-house usage record not found');
    }

    if (usage.status !== InhouseUsageStatus.ACTIVE) {
      throw new BadRequestException(`This usage session has already been ${usage.status}`);
    }

    usage.endedAt = new Date();
    usage.durationMinutes = Math.floor((usage.endedAt.getTime() - usage.startedAt.getTime()) / (1000 * 60));
    usage.status = isForced ? InhouseUsageStatus.FORCE_ENDED : InhouseUsageStatus.COMPLETED;

    const updatedUsage = await this.inhouseUsageRepository.save(usage);
    return this.mapToResponseDto(updatedUsage);
  }

  async getAllUsages(
    limit: number = 5,
    offset: number = 0,
    status: InhouseUsageStatus | undefined,
  ): Promise<{ items: InhouseUsageResponseDto[], total: number }> {
    // Get today's date at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date at 00:00:00
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const qb = this.inhouseUsageRepository.createQueryBuilder('inhouseUsage')
      .leftJoinAndSelect('inhouseUsage.copy', 'copy')
      .leftJoinAndSelect('copy.book', 'book')
      .leftJoinAndSelect('inhouseUsage.user', 'user')
      .orderBy('inhouseUsage.startedAt', 'DESC')
      .skip(offset)
      .take(3);

      
      // Filter for records where startedAt is between today 00:00:00 and tomorrow 00:00:00
      // .where('inhouseUsage.startedAt >= :startOfDay', { startOfDay: today })
      // .andWhere('inhouseUsage.startedAt < :endOfDay', { endOfDay: tomorrow })

    if (status) {
      qb.andWhere('inhouseUsage.status = :status', { status });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map(usage => this.mapToResponseDto(usage)), total };
  }

  async getUserActiveUsages(userId: string): Promise<InhouseUsageResponseDto[]> {
    const usages = await this.inhouseUsageRepository.find({
      where: {
        user: { id: userId },
        status: InhouseUsageStatus.ACTIVE
      },
      relations: ['copy', 'copy.book', 'user'],
      order: { startedAt: 'DESC' }
    });
    return usages.map(usage => this.mapToResponseDto(usage));
  }

  async getUserUsageHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ items: InhouseUsageResponseDto[]; total: number }> {
    const [items, total] = await this.inhouseUsageRepository.findAndCount({
      where: {
        user: { id: userId },
        status: InhouseUsageStatus.COMPLETED
      },
      relations: ['copy', 'copy.book', 'user'],
      order: { endedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      items: items.map(usage => this.mapToResponseDto(usage)),
      total,
    };
  }

  async deleteUsage(usageId: string): Promise<void> {
    const usage = await this.inhouseUsageRepository.findOne({ where: { id: usageId } });
    if (!usage) {
      throw new NotFoundException(`Usage with ID ${usageId} not found`);
    }

    // Instead of deleting, mark as cancelled
    usage.status = InhouseUsageStatus.CANCELLED;
    await this.inhouseUsageRepository.save(usage);
  }

  private mapToResponseDto(usage: BookInhouseUsage): InhouseUsageResponseDto {
    return {
      id: usage.id,
      copy: usage.copy || null,
      user: usage.user,
      startedAt: usage.startedAt,
      endedAt: usage.endedAt,
      durationMinutes: usage.durationMinutes,
      status: usage.status,
      createdAt: usage.createdAt,
    };
  }
}
