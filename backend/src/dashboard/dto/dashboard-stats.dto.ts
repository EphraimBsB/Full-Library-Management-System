import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total number of book copies in the library' })
  totalCopies: number;

  @ApiProperty({ description: 'Total number of available book copies' })
  availableCopies: number;

  @ApiProperty({ description: 'Total number of users in the system' })
  users: number;

  @ApiProperty({ description: 'Total number of active loans' })
  loans: number;

  @ApiProperty({ description: 'Number of overdue loans' })
  overdue: number;
}
