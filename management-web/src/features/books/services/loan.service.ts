import { apiClient } from '../../../core/network/api_client';

export interface IssueBookToUserDto {
  rollNumber: string;
  bookId?: string;
  accessNumber?: string;
}

export const LoanService = {
  issueBookToUser: async (data: IssueBookToUserDto) => {
    return apiClient.post('/loans/issue-to-user', data);
  },
};
