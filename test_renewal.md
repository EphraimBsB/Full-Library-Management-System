# Book Renewal Debugging Guide

## Issues Fixed

### 1. Membership Type Retrieval Logic
**Problem**: The renewal service was defaulting to 0 renewals when membership type lookup failed.
**Fix**: Improved membership type retrieval logic with proper fallback to config defaults.

### 2. Entity Method Bug
**Problem**: `Membership.canRenew()` was checking against `maxDurationDays` instead of `renewalLimit`.
**Fix**: Updated to check against the correct `renewalLimit` property.

### 3. Error Handling
**Problem**: Generic error messages made debugging difficult.
**Fix**: Added specific error messages and debugging logs.

## Testing Steps

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start Flutter App**:
   ```bash
   cd frontend
   flutter run
   ```

3. **Test Renewal Scenarios**:
   - Login as a user with an active loan
   - Navigate to loan details
   - Click "RENEW LOAN"
   - Check backend logs for detailed debugging information

## Common Renewal Issues & Solutions

### Issue: "Maximum number of renewals reached"
**Cause**: User has reached their membership type's renewal limit
**Solution**: Check membership type settings in database

### Issue: "Active membership is required"
**Cause**: User's membership has expired or is inactive
**Solution**: Update user's membership status and expiry date

### Issue: "This book has been requested by another user"
**Cause**: Another user has a pending request for the same book
**Solution**: User must return the book instead of renewing

### Issue: "Only active loans can be renewed"
**Cause**: Loan is already returned, overdue, or has invalid status
**Solution**: Check loan status in database

## Backend Logs to Monitor

When testing renewal, look for these log messages:
- `Attempting to renew loan {loanId} for user {userId}`
- `Found active membership: {membershipId}, type: {typeName}`
- `Using membership type from active membership: {typeName}`
- `Renewal limits - Current: {current}, Max: {max}`

## Database Queries for Debugging

### Check User's Active Membership
```sql
SELECT m.*, mt.name as type_name, mt.renewal_limit 
FROM memberships m 
JOIN membership_types mt ON m.membership_type_id = mt.id 
WHERE m.user_id = 'USER_ID' AND m.status = 'active' AND m.expiry_date >= NOW();
```

### Check Loan Details
```sql
SELECT l.*, bl.title, bl.author 
FROM book_loans l 
JOIN book_copies bc ON l.book_copy_id = bc.id 
JOIN books bl ON bc.book_id = bl.id 
WHERE l.id = 'LOAN_ID';
```

### Check Pending Book Requests
```sql
SELECT COUNT(*) as pending_requests 
FROM book_requests br 
WHERE br.book_id = (SELECT bc.book_id FROM book_loans bl JOIN book_copies bc ON bl.book_copy_id = bc.id WHERE bl.id = 'LOAN_ID') 
AND br.user_id != 'USER_ID' 
AND br.status = 'pending';
```

## Configuration Values

Check these environment variables in `.env`:
- `MAX_RENEWALS=2` (default maximum renewals)
- `RENEWAL_DAYS=7` (default renewal period)

Membership type specific values (from database):
- `renewal_limit` (per membership type)
- `max_duration_days` (loan period per renewal)
