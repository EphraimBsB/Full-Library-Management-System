import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/membership/domain/models/membership_request_model.dart';

abstract class MembershipRequestRepository {
  /// Creates a new membership request
  Future<Either<Failure, MembershipRequest>> createMembershipRequest(
    Map<String, dynamic> data,
  );

  /// Retrieves a specific membership request by ID
  Future<Either<Failure, MembershipRequest>> getMembershipRequest(String id);

  /// Retrieves all membership requests with optional filtering
  Future<Either<Failure, List<MembershipRequest>>> getMembershipRequests({
    String? status,
    int? page,
    int? limit,
  });

  /// Approves a membership request
  Future<Either<Failure, Map<String, dynamic>>> approveMembershipRequest(
    String requestId, {
    Map<String, dynamic>? data,
  });

  /// Rejects a membership request
  Future<Either<Failure, Map<String, dynamic>>> rejectMembershipRequest(
    String requestId, {
    required String reason,
  });

  /// Updates a membership request
  Future<Either<Failure, MembershipRequest>> updateMembershipRequest(
    String requestId, {
    required Map<String, dynamic> updates,
  });

  /// Deletes a membership request
  Future<Either<Failure, void>> deleteMembershipRequest(String requestId);
}
