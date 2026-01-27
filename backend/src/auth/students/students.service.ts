import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class StudentsService {
  constructor(private readonly httpService: HttpService) {}

  async getStudentDetails(rollNumber: string): Promise<any> {
    const thirdPartyApiUrl =
      'https://ilimsapi.isbatuniversity.ac.ug:9093/api/StudentDetails';

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(thirdPartyApiUrl, {
          params: { rollno: rollNumber },
          timeout: 15000, // 15 seconds timeout
        }),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        'Error fetching student details from third-party API:',
        axiosError.message,
      );

      // Re-throw the error to be handled by the controller
      throw axiosError;
    }
  }
}
