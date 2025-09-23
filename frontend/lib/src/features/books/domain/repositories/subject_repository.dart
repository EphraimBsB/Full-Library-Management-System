import '../models/subject_model.dart';

abstract class SubjectRepository {
  Future<List<SubjectModel>> getSubjects();
}
