// frontend/lib/src/features/settings/modules/data_import/presentation/screens/data_import_screen.dart
import 'dart:developer' as dev;
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/settings/modules/data_import/domain/models/import_result.dart';
import 'package:management_side/src/features/settings/modules/data_import/presentation/providers/data_import_providers.dart';

class DataImportScreen extends ConsumerStatefulWidget {
  const DataImportScreen({super.key});

  @override
  ConsumerState<DataImportScreen> createState() => _DataImportScreenState();
}

class _DataImportScreenState extends ConsumerState<DataImportScreen>
    with TickerProviderStateMixin {
  late AnimationController _progressController;
  late AnimationController _pulseController;
  late Animation<double> _progressAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _progressAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _progressController, curve: Curves.easeInOut),
    );

    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _pulseController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _progressController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final importResult = ref.watch(importResultProvider);
    final isImporting = ref.watch(importInProgressProvider);

    // Start/stop progress animation based on import state
    if (isImporting && !_progressController.isAnimating) {
      _progressController.repeat();
    } else if (!isImporting && _progressController.isAnimating) {
      _progressController.stop();
      _progressController.reset();
    }

    return AlertDialog(
      backgroundColor: AppTheme.backgroundColor,
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text('Data Import'),
          IconButton(
            onPressed: () {
              Navigator.pop(context);
            },
            icon: const Icon(Icons.close),
          ),
        ],
      ),
      content: SizedBox(
        width: MediaQuery.of(context).size.width * 0.8,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildImportCard(ref, isImporting),
              const SizedBox(height: 24),
              if (isImporting) _buildProgressIndicator(),
              if (importResult != null) ...[
                const SizedBox(height: 24),
                _buildImportResult(importResult),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImportCard(WidgetRef ref, bool isImporting) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.upload_file,
                  color: isImporting ? Colors.blue : Colors.grey,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  'Import Books from Excel',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isImporting ? Colors.blue : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Upload an Excel file to import books into the system. The first row should contain headers.',
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
            const SizedBox(height: 24),
            AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: isImporting ? _pulseAnimation.value : 1.0,
                  child: ElevatedButton.icon(
                    onPressed: isImporting
                        ? null
                        : () => _pickAndImportFile(ref),
                    icon: isImporting
                        ? SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Icon(Icons.upload_file),
                    label: Text(
                      isImporting ? 'Processing...' : 'Select Excel File',
                    ),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        vertical: 12,
                        horizontal: 16,
                      ),
                      backgroundColor: isImporting ? Colors.blue : null,
                      foregroundColor: isImporting ? Colors.white : null,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Row(
              children: [
                AnimatedBuilder(
                  animation: _progressAnimation,
                  builder: (context, child) {
                    return SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        value: _progressAnimation.value,
                        backgroundColor: Colors.grey[300],
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                      ),
                    );
                  },
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Importing books...',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                ),
                AnimatedBuilder(
                  animation: _pulseAnimation,
                  builder: (context, child) {
                    return Icon(
                      Icons.cloud_upload,
                      color: Colors.blue.withOpacity(0.7),
                      size: _pulseAnimation.value * 20,
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
            AnimatedBuilder(
              animation: _progressAnimation,
              builder: (context, child) {
                return LinearProgressIndicator(
                  value: _progressAnimation.value,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                  minHeight: 6,
                );
              },
            ),
            const SizedBox(height: 12),
            const Text(
              'Processing Excel file and fetching book data from WorldCat...',
              style: TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImportResult(AsyncValue<ImportResult> importResult) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.assessment, color: Colors.blue, size: 24),
                const SizedBox(width: 8),
                const Text(
                  'Import Results',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 20),
            importResult.when(
              data: (result) => _buildResultDetails(result),
              loading: () => const Center(
                child: Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 12),
                    Text('Processing results...'),
                  ],
                ),
              ),
              error: (error, stack) => Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Error: $error',
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultDetails(ImportResult result) {
    final successRate = result.total > 0
        ? (result.imported / result.total * 100)
        : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Progress Overview Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.blue[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.blue[200]!),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Import Progress',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    '${successRate.toStringAsFixed(1)}% Complete',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: successRate >= 80 ? Colors.green : Colors.orange,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              LinearProgressIndicator(
                value: successRate / 100,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(
                  successRate >= 80 ? Colors.green : Colors.orange,
                ),
                minHeight: 8,
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Statistics Grid
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Total Rows',
                result.total.toString(),
                Icons.list_alt,
                Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Successfully Imported',
                result.imported.toString(),
                Icons.check_circle,
                Colors.green,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Failed',
                result.failed.toString(),
                Icons.error,
                Colors.red,
                show: result.failed > 0,
              ),
            ),
          ],
        ),

        const SizedBox(height: 20),

        // Duration Info
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(Icons.schedule, size: 16, color: Colors.grey[600]),
              const SizedBox(width: 6),
              Text(
                'Duration: ${(result.duration / 1000).toStringAsFixed(1)}s',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Warnings Section
        if (result.warnings.isNotEmpty) ...[
          _buildMessageSection(
            'Warnings',
            result.warnings,
            Icons.warning,
            Colors.orange,
            Colors.orange[50]!,
            Colors.orange[200]!,
          ),
          const SizedBox(height: 16),
        ],

        // Errors Section
        if (result.errors.isNotEmpty) ...[
          _buildMessageSection(
            'Errors',
            result.errors,
            Icons.error,
            Colors.red,
            Colors.red[50]!,
            Colors.red[200]!,
          ),
        ],
      ],
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    IconData icon,
    Color color, {
    bool show = true,
  }) {
    if (!show) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildMessageSection(
    String title,
    List<String> messages,
    IconData icon,
    Color color,
    Color backgroundColor,
    Color borderColor,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  '$title (${messages.length})',
                  style: TextStyle(fontWeight: FontWeight.bold, color: color),
                ),
              ],
            ),
          ),
          ...messages.map(
            (message) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    width: 4,
                    height: 4,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      message,
                      style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickAndImportFile(WidgetRef ref) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx', 'xls'],
      );

      if (result != null) {
        final file = File(result.files.single.path!);
        await _importFile(ref, file);
      }
    } catch (e) {
      ScaffoldMessenger.of(
        ref.context,
      ).showSnackBar(SnackBar(content: Text('Error selecting file: $e')));
    }
  }

  Future<void> _importFile(WidgetRef ref, File file) async {
    try {
      ref.read(importInProgressProvider.notifier).state = true;
      ref.read(importResultProvider.notifier).state =
          const AsyncValue.loading();

      final repository = ref.read(dataImportRepositoryProvider);
      final result = await repository.importBooks(file);

      ref.read(importResultProvider.notifier).state = AsyncValue.data(result);

      ScaffoldMessenger.of(ref.context).showSnackBar(
        SnackBar(
          content: Text(
            'Successfully imported ${result.imported} of ${result.total} books',
          ),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ref.read(importResultProvider.notifier).state = AsyncValue.error(
        e,
        StackTrace.current,
      );
      dev.log('Error: $e');
      ScaffoldMessenger.of(ref.context).showSnackBar(
        SnackBar(
          content: Text('Import failed: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      ref.read(importInProgressProvider.notifier).state = false;
    }
  }
}
