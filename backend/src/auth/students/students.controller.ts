import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { StudentsService } from './students.service';

@Controller('student-details')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Public()
  @Get()
  async getStudentDetails(@Query('rollno') rollNumber: string) {
    if (!rollNumber) {
      throw new HttpException(
        'Roll number is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const studentDetails =
        await this.studentsService.getStudentDetails(rollNumber);
      return studentDetails;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new HttpException(
          'Unable to connect to student verification service',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        throw new HttpException(
          'Failed to fetch student details',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
