# Renewal Request Workflow Implementation

## Overview
Implemented a new renewal request system where students submit renewal requests that require librarian approval, replacing the previous direct renewal system.

## Backend Implementation

### 1. Enhanced BookRequest Entity
**File**: `backend/src/books/entities/book-request.entity.ts`

**Changes**:
- Added new enum `BookRequestType` with values `BORROW` and `RENEWAL`
- Added new request statuses: `RENEWAL_PENDING`, `RENEWAL_APPROVED`, `RENEWAL_REJECTED`
- Added `requestType` field to distinguish between borrow and renewal requests
- Added `loanId` field to link renewal requests to specific loans

### 2. Renewal Request Service Methods
**File**: `backend/src/books/services/book-request.service.ts`

**New Methods**:
- `createRenewalRequest(loanId, userId, reason)` - Creates renewal request with validation
- `approveRenewalRequest(requestId, approvedById)` - Approves and processes renewal
- `rejectRenewalRequest(requestId, rejectedById, reason)` - Rejects renewal request
- `findRenewalRequests(status?)` - Retrieves all renewal requests

**Validations**:
- Loan must exist and belong to the user
- Loan must be in ACTIVE status
- User must have active membership
- Cannot exceed renewal limits
- No pending renewal requests for the same loan
- No other users have pending requests for the same book

### 3. API Endpoints
**File**: `backend/src/books/controllers/book-request.controller.ts`

**New Endpoints**:
- `POST /book-requests/renewal` - Create renewal request (Students)
- `GET /book-requests/renewal/all` - Get all renewal requests (Librarians/Admins)
- `POST /book-requests/renewal/:requestId/approve` - Approve renewal (Librarians/Admins)
- `POST /book-requests/renewal/:requestId/reject` - Reject renewal (Librarians/Admins)

### 4. DTOs
**File**: `backend/src/books/dto/renewal-request.dto.ts`

**New DTOs**:
- `CreateRenewalRequestDto` - For creating renewal requests
- `ApproveRejectRenewalDto` - For approving/rejecting requests
- `RenewalRequestResponseDto` - Response format

## Frontend Implementation

### 1. Flutter Management Portal
**Files**: 
- `frontend/lib/src/features/loans/data/api/loan_api_service.dart`
- `frontend/lib/src/features/loans/domain/repositories/loan_repository.dart`
- `frontend/lib/src/features/loans/data/repositories/loan_repository_impl.dart`
- `frontend/lib/src/features/loans/presentation/providers/loan_provider.dart`
- `frontend/lib/src/features/loans/presentation/screens/loan_details_dialog.dart`

**Changes**:
- Added `createRenewalRequest` API method
- Updated repository and provider to handle renewal requests
- Modified loan details dialog to submit renewal requests instead of direct renewal
- Enhanced error handling with specific renewal request messages

### 2. React Student Web Portal
**File**: `student-web/src/pages/Profile.js`

**Changes**:
- Added renewal request API method to `ApiService`
- Added renewal request dialog with optional reason field
- Added "Request Renewal" button for active loans
- Added success/error snackbar notifications
- Enhanced UI with Material-UI components

## Workflow Process

### Student Flow (React Web Portal)
1. Student views their active loans in Profile page
2. Clicks "Request Renewal" button on active loan
3. Fills optional reason in dialog
4. Submits renewal request
5. Sees success message and awaits librarian approval

### Librarian Flow (Flutter Management Portal)
1. Librarian views renewal requests in management system
2. Reviews loan details and renewal reason
3. Approves or rejects renewal request
4. System automatically processes approved renewals

### Backend Processing
1. **Request Creation**: Validates loan, membership, and renewal limits
2. **Approval**: Updates request status and calls existing `renewLoan()` method
3. **Rejection**: Updates request status with rejection reason
4. **Notifications**: Sends email notifications for status changes

## Database Schema Changes

### BookRequest Table
- `requestType` (ENUM) - Distinguishes borrow vs renewal requests
- `loanId` (UUID) - Links renewal requests to specific loans
- New status values for renewal workflow

## API Response Examples

### Create Renewal Request
```json
POST /book-requests/renewal
{
  "loanId": "uuid-here",
  "reason": "Need more time for research"
}

Response:
{
  "id": "renewal-request-uuid",
  "status": "RENEWAL_PENDING",
  "message": "Renewal request submitted successfully"
}
```

### Approve Renewal Request
```json
POST /book-requests/renewal/:requestId/approve
{
  "reason": "Approved for research purposes"
}

Response: Updated BookLoan object with new due date
```

## Error Handling

### Common Error Scenarios
- **Maximum renewal limit reached**: "Maximum renewal limit (X) reached for this loan"
- **Book requested by others**: "This book has been requested by another user and cannot be renewed"
- **Loan not active**: "Only active loans can be renewed"
- **Already pending**: "A renewal request for this loan is already pending"
- **Membership expired**: "Active membership is required to request renewals"

## Benefits

1. **Control**: Librarians have oversight of all renewals
2. **Fairness**: Prevents renewal when others are waiting for books
3. **Audit Trail**: Complete history of renewal requests and decisions
4. **Flexibility**: Optional reason field provides context for decisions
5. **User Experience**: Clear process with status updates

## Migration Notes

- Existing direct renewal functionality preserved for librarians/admins
- Students now use request-based system
- All existing loan data remains compatible
- Gradual migration possible with both systems running in parallel

## Testing Checklist

### Backend Tests
- [ ] Create renewal request for valid loan
- [ ] Reject renewal request for loan with pending book requests
- [ ] Approve renewal request and verify loan extension
- [ ] Test renewal limit enforcement
- [ ] Test membership validation

### Frontend Tests
- [ ] Student can submit renewal request
- [ ] Renewal button appears only for active loans
- [ ] Dialog validation and submission
- [ ] Success/error message display
- [ ] Librarian can approve/reject requests

### Integration Tests
- [ ] End-to-end renewal request flow
- [ ] Email notifications for status changes
- [ ] Database consistency during approval
- [ ] Concurrent renewal request handling
