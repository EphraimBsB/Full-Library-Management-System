import 'dart:developer' as dev;

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/student/data/api/student_api_service.dart';
import 'package:dio/dio.dart';

// API Service Provider
final studentApiServiceProvider = Provider<StudentApiService>((ref) {
  return StudentApiService(ApiClient().dio);
});

// Student Details Provider
final studentDetailsProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, String>((ref, rollNumber) async {
      try {
        final apiService = ref.watch(studentApiServiceProvider);
        final studentDetails = await apiService.getStudentDetails(rollNumber);
        dev.log('Apirespons==>$studentDetails');
        return studentDetails;
      } on DioException catch (e) {
        if (kDebugMode) {
          dev.log(
            'Dio error fetching student details: ${e.type}',
            error: e,
            stackTrace: e.stackTrace,
          );
        }

        // Handle specific error types
        if (e.type == DioExceptionType.connectionError) {
          throw Exception(
            'Unable to connect to student verification service. This may be due to network restrictions or CORS policies. Please try again later or contact support.',
          );
        } else if (e.type == DioExceptionType.connectionTimeout) {
          throw Exception(
            'Connection timeout. Please check your internet connection and try again.',
          );
        } else if (e.type == DioExceptionType.badResponse) {
          if (e.response?.statusCode == 404) {
            throw Exception('Student not found with roll number: $rollNumber');
          } else if (e.response?.statusCode == 500) {
            throw Exception(
              'Student verification service is currently unavailable. Please try again later.',
            );
          } else {
            throw Exception(
              'Server error: ${e.response?.statusCode}. Please try again later.',
            );
          }
        } else {
          throw Exception(
            'Failed to fetch student details: ${e.message ?? 'Unknown error'}',
          );
        }
      } catch (e, stackTrace) {
        if (kDebugMode) {
          dev.log(
            'Error fetching student details',
            error: e,
            stackTrace: stackTrace,
          );
        }
        throw Exception('Failed to fetch student details: $e');
      }
    });
