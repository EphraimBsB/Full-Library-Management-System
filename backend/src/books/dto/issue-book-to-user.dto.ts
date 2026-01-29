import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IssueBookToUserDto {
  @ApiProperty({
    description: 'Roll number of the user to issue the book to',
    example: '2023-1001',
  })
  @IsString()
  @IsNotEmpty()
  rollNumber: string;

  @ApiPropertyOptional({
    description: 'Access number of the specific copy to issue',
    example: 'ACC-001',
  })
  @IsString()
  @IsOptional()
  accessNumber?: string;

  @ApiPropertyOptional({
    description: 'Book ID (required if accessNumber is not provided)',
    example: '123',
  })
  @IsString()
  @IsOptional()
  bookId?: string;
}
