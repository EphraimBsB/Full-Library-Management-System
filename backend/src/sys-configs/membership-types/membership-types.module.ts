import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipType } from './entities/membership-type.entity';
import { Membership } from 'src/membership/entities/membership.entity';
import { MembershipTypesService } from './membership-types.service';
import { MembershipTypesController } from './membership-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MembershipType, Membership])],
  controllers: [MembershipTypesController],
  providers: [MembershipTypesService],
  exports: [MembershipTypesService],
})
export class MembershipTypesModule {}
