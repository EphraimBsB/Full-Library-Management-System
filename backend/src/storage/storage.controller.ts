import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { StorageService } from './storage.service';
import { CreateUploadIntentDto } from './dto/create-upload-intent.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload-intent')
  @HttpCode(HttpStatus.CREATED)
  async createUploadIntent(
    @GetUser() user: User,
    @Body() dto: CreateUploadIntentDto,
  ) {
    // user.id is used to namespace keys
    return this.storage.createUploadIntent(user.id, dto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirmUpload(@Body() dto: ConfirmUploadDto) {
    return this.storage.confirmUpload(dto.key);
  }
}
