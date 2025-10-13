import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total number of books in the library' })
  books: number;

  @ApiProperty({ description: 'Total number of users in the system' })
  users: number;

  @ApiProperty({ description: 'Total number of active loans' })
  loans: number;

  @ApiProperty({ description: 'Number of overdue loans' })
  overdue: number;
}
