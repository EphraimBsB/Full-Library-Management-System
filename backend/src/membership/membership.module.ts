import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { MembershipRequest } from './entities/membership-request.entity';
import { MembershipType } from 'src/sys-configs/membership-types/entities/membership-type.entity';
import { MembershipService } from './membership.service';
import { MembershipRequestService } from './membership-request.service';
import { MembershipRequestController } from './membership-request.controller';
import { UsersModule } from '../users/users.module';
import { BooksModule } from '../books/books.module';
import { MembershipController } from './membership.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Membership, MembershipRequest, MembershipType]),
    forwardRef(() => UsersModule),
    forwardRef(() => BooksModule),
  ],
  controllers: [MembershipController, MembershipRequestController],
  providers: [MembershipService, MembershipRequestService],
  exports: [MembershipService, MembershipRequestService],
})
export class MembershipModule {}
