import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/subjects/data/api/book_subject_api_service.dart';
import 'package:management_side/src/features/settings/modules/subjects/data/repositories/subject_repository_impl.dart';
import 'package:management_side/src/features/settings/modules/subjects/domain/models/subject_model.dart';
import 'package:management_side/src/features/settings/modules/subjects/domain/repositories/subject_repository.dart';

// Repository Provider
final subjectRepositoryProvider = Provider<SubjectRepository>((ref) {
  final apiClient = ApiClient();
  final apiService = SubjectApiService(apiClient.dio);
  return SubjectRepositoryImpl(apiService);
});

// State Notifier
class SubjectsNotifier extends StateNotifier<AsyncValue<List<Subject>>> {
  final SubjectRepository _repository;

  SubjectsNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadSubjects();
  }

  Future<void> loadSubjects() async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getSubjects(
        page: 1,
        limit: 100, // Load all Subjects
      );
      state = result.fold(
        (failure) => AsyncValue.error(failure, StackTrace.current),
        (Subjects) => AsyncValue.data(Subjects),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> refresh() => loadSubjects();

  Future<void> addSubject(Subject Subject) async {
    final result = await _repository.createSubject(Subject);
    await result.fold((failure) => throw failure, (_) => loadSubjects());
  }

  Future<void> updateSubject(Subject Subject) async {
    final result = await _repository.updateSubject(Subject);
    await result.fold((failure) => throw failure, (_) => loadSubjects());
  }

  Future<void> deleteSubject(int id) async {
    final result = await _repository.deleteSubject(id);
    await result.fold((failure) => throw failure, (_) => loadSubjects());
  }

  Future<void> toggleSubjectStatus(int id, bool isActive) async {
    final result = await _repository.toggleSubjectStatus(id, isActive);
    await result.fold((failure) => throw failure, (_) => loadSubjects());
  }
}

// State Notifier Provider
final subjectsNotifierProvider =
    StateNotifierProvider<SubjectsNotifier, AsyncValue<List<Subject>>>((ref) {
      final repository = ref.watch(subjectRepositoryProvider);
      return SubjectsNotifier(repository);
    });
