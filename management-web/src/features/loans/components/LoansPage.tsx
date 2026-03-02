import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Menu,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  FilterList,
  Sort,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoanService, LoanStatus, BookRequestStatus, type Loan } from '../services/loan.service';
import { LoanCard } from './LoanCard';
import { RequestCard } from './RequestCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const LoansPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LoanStatus | ''>('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [error, setError] = useState<string | null>(null); // Add error state
  
  // Filter and sort states
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<'borrowedAt' | 'dueDate' | 'borrowerName' | 'bookTitle'>('borrowedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const queryClient = useQueryClient();

  // Fetch loans
  const { data: loansResponse, isLoading: loansLoading, error: loansError } = useQuery({
    queryKey: ['loans', search, selectedStatus, sortBy, sortOrder],
    queryFn: () => LoanService.getAllLoans({
      status: selectedStatus || undefined,
      page: 1,
      limit: 50,
    }),
  });

  // Fetch pending requests
  const { data: pendingRequests, isLoading: requestsLoading, error: requestsError } = useQuery({
    queryKey: ['book-requests', BookRequestStatus.PENDING],
    queryFn: () => LoanService.getAllBookRequests(BookRequestStatus.PENDING),
  });

  // Fetch pending renewal requests
  const { data: renewalRequests, isLoading: renewalsLoading, error: renewalsError } = useQuery({
    queryKey: ['renewal-requests'],
    queryFn: () => LoanService.getRenewalRequests(), // Don't filter by status to get all renewal requests
  });

  // Fetch rejected requests
  const { data: rejectedRequests, isLoading: rejectedLoading, error: rejectedError } = useQuery({
    queryKey: ['rejected-requests'],
    queryFn: async () => {
      const [borrowRequests, renewalRequests] = await Promise.all([
        LoanService.getAllBookRequests(BookRequestStatus.REJECTED),
        LoanService.getRenewalRequests(BookRequestStatus.RENEWAL_REJECTED),
      ]);
      return { borrowRequests, renewalRequests };
    },
  });

  // Renew loan mutation
  // const renewLoanMutation = useMutation({
  //   mutationFn: LoanService.renewLoan,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['loans'] });
  //     queryClient.invalidateQueries({ queryKey: ['book-requests'] });
  //   },
  // });

  // Return loan mutation
  const returnLoanMutation = useMutation({
    mutationFn: LoanService.returnBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setError(null); // Clear error on success
    },
    onError: (error: any) => {
      console.error('Return loan error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to return loan';
      setError(errorMessage); // Set error state
    },
  });

  // Approve request mutation
  const approveRequestMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) =>
      LoanService.approveBookRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-requests'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setError(null); // Clear error on success
    },
    onError: (error: any) => {
      console.error('Approval error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to approve request';
      setError(errorMessage); // Set error state
    },
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) =>
      LoanService.rejectBookRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-requests'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setError(null); // Clear error on success
    },
    onError: (error: any) => {
      console.error('Rejection error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject request';
      setError(errorMessage); // Set error state
    },
  });

  // Approve renewal request mutation
  const approveRenewalRequestMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) =>
      LoanService.approveRenewalRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setError(null); // Clear error on success
    },
    onError: (error: any) => {
      console.error('Renewal approval error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to approve renewal request';
      setError(errorMessage); // Set error state
    },
  });

  // Reject renewal request mutation
  const rejectRenewalRequestMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) =>
      LoanService.rejectRenewalRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setError(null); // Clear error on success
    },
    onError: (error: any) => {
      console.error('Renewal rejection error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject renewal request';
      setError(errorMessage); // Set error state
    },
  });

  // const handleRenewLoan = (loanId: string) => {
  //   renewLoanMutation.mutate(loanId);
  // };

  const handleReturnLoan = (loanId: string) => {
    returnLoanMutation.mutate(loanId);
  };

  const handleApproveRequest = (requestId: string, preferredCopyId?: string, notes?: string) => {
    approveRequestMutation.mutate({ 
      requestId, 
      data: { preferredCopyId, notes } 
    });
  };

  const handleRejectRequest = (requestId: string, reason: string) => {
    rejectRequestMutation.mutate({ requestId, data: { notes: reason } });
  };

  const handleApproveRenewalRequest = (requestId: string, notes?: string) => {
    approveRenewalRequestMutation.mutate({ 
      requestId, 
      data: { notes } 
    });
  };

  const handleRejectRenewalRequest = (requestId: string, reason: string) => {
    rejectRenewalRequestMutation.mutate({ requestId, data: { notes: reason } });
  };

  const handleViewLoanDetails = (loan: Loan) => {
    setSelectedLoan(loan);
    console.log('View loan details:', loan.id);
  };

  const loans = loansResponse?.data || [];

  // Filter renewal requests to show only pending ones
  const pendingRenewalRequests = renewalRequests?.filter(
    request => request.status === BookRequestStatus.RENEWAL_PENDING
  ) || [];

  // Debug: Log renewal requests
  console.log('All renewal requests:', renewalRequests);
  console.log('Pending renewal requests:', pendingRenewalRequests);

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.5rem' }}>
          Loans Management
        </Typography>
        <Typography variant="body2" sx={{ color: '#667085', fontSize: '0.8rem' }}>
          Manage loan requests, track borrowed books, and handle renewals
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              size="small" 
              color="inherit" 
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Search and Filter Bar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search loans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ 
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: 'white'
            }
          }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, fontSize: 14 }} />,
          }}
        />
        
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
          sx={{ fontSize: '0.7rem' }}
        >
          Filter
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Sort />}
          onClick={(e) => setSortMenuAnchor(e.currentTarget)}
          sx={{ fontSize: '0.7rem' }}
        >
          Sort
        </Button>

        {/* <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ fontSize: '0.7rem' }}
        >
          Issue Book
        </Button> */}
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setSelectedStatus(''); setFilterMenuAnchor(null); }}>
          All Statuses
        </MenuItem>
        {Object.values(LoanStatus).map((status) => (
          <MenuItem key={status} onClick={() => { setSelectedStatus(status); setFilterMenuAnchor(null); }}>
            {status}
          </MenuItem>
        ))}
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setSortBy('borrowedAt'); setSortOrder('desc'); setSortMenuAnchor(null); }}>
          Newest First
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('borrowedAt'); setSortOrder('asc'); setSortMenuAnchor(null); }}>
          Oldest First
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('dueDate'); setSortOrder('asc'); setSortMenuAnchor(null); }}>
          Due Date (Ascending)
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('dueDate'); setSortOrder('desc'); setSortMenuAnchor(null); }}>
          Due Date (Descending)
        </MenuItem>
      </Menu>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Pending Requests" sx={{ fontSize: '0.8rem' }} />
          <Tab label="All Loans" sx={{ fontSize: '0.8rem' }} />
          <Tab label="Overdue" sx={{ fontSize: '0.8rem' }} />
          <Tab label="Rejected" sx={{ fontSize: '0.8rem' }} />
        </Tabs>
      </Box>

      {/* Pending Requests Tab */}
      <TabPanel value={activeTab} index={0}>
        {requestsLoading || renewalsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : requestsError || renewalsError ? (
          <Alert severity="error">Error loading requests</Alert>
        ) : (!pendingRequests?.length && !pendingRenewalRequests?.length) ? (
          <Alert severity="info">No pending requests</Alert>
        ) : (
          <>
            {/* Borrow Requests Section */}
            {pendingRequests && pendingRequests.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '0.9rem', fontWeight: 600 }}>
                  Book Borrow Requests ({pendingRequests.length})
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
                  {pendingRequests.map((request) => (
                    <Box key={request.id}>
                      <RequestCard
                        request={request}
                        onApprove={handleApproveRequest}
                        onReject={handleRejectRequest}
                        onViewDetails={() => console.log('View request details', request.id)}
                      />
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Renewal Requests Section */}
            {pendingRenewalRequests && pendingRenewalRequests.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '0.9rem', fontWeight: 600 }}>
                  Book Renewal Requests ({pendingRenewalRequests.length})
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
                  {pendingRenewalRequests.map((request) => (
                    <Box key={request.id}>
                      <RequestCard
                        request={request}
                        onApprove={handleApproveRenewalRequest}
                        onReject={handleRejectRenewalRequest}
                        onViewDetails={() => console.log('View renewal request details', request.id)}
                      />
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </>
        )}
      </TabPanel>

      {/* All Loans Tab */}
      <TabPanel value={activeTab} index={1}>
        {loansLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : loansError ? (
          <Alert severity="error">Error loading loans</Alert>
        ) : !loans.length ? (
          <Alert severity="info">No loans found</Alert>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
            {loans.map((loan) => (
              <Box key={loan.id}>
                <LoanCard
                  loan={loan}
                  onViewDetails={() => handleViewLoanDetails(loan)}
                  // onRenew={() => handleRenewLoan(loan.id)}
                  onReturn={() => handleReturnLoan(loan.id)}
                />
              </Box>
            ))}
          </Box>
        )}
      </TabPanel>

      {/* Overdue Tab */}
      <TabPanel value={activeTab} index={2}>
        <Alert severity="info">Overdue loans feature coming soon...</Alert>
      </TabPanel>

      {/* Rejected Requests Tab */}
      <TabPanel value={activeTab} index={3}>
        {rejectedLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : rejectedError ? (
          <Alert severity="error">Error loading rejected requests</Alert>
        ) : (!rejectedRequests?.borrowRequests?.length && !rejectedRequests?.renewalRequests?.length) ? (
          <Alert severity="info">No rejected requests</Alert>
        ) : (
          <>
            {/* Rejected Borrow Requests Section */}
            {rejectedRequests?.borrowRequests && rejectedRequests.borrowRequests.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '0.9rem', fontWeight: 600 }}>
                  Rejected Borrow Requests ({rejectedRequests.borrowRequests.length})
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
                  {rejectedRequests.borrowRequests.map((request) => (
                    <Box key={request.id}>
                      <RequestCard
                        request={request}
                        onApprove={handleApproveRequest}
                        onReject={handleRejectRequest}
                        onViewDetails={() => console.log('View rejected request details', request.id)}
                      />
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Rejected Renewal Requests Section */}
            {rejectedRequests?.renewalRequests && rejectedRequests.renewalRequests.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '0.9rem', fontWeight: 600 }}>
                  Rejected Renewal Requests ({rejectedRequests.renewalRequests.length})
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
                  {rejectedRequests.renewalRequests.map((request) => (
                    <Box key={request.id}>
                      <RequestCard
                        request={request}
                        onApprove={handleApproveRenewalRequest}
                        onReject={handleRejectRenewalRequest}
                        onViewDetails={() => console.log('View rejected renewal request details', request.id)}
                      />
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </>
        )}
      </TabPanel>

      {/* Loan Details Dialog - Coming Soon */}
      {selectedLoan && (
        <Box>
          {/* LoanDetailsDialog will be implemented here */}
        </Box>
      )}
    </Box>
  );
};
