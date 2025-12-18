// frontend/lib/src/features/settings/modules/data_import/presentation/screens/data_import_screen.dart
import 'dart:developer' as dev;
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/settings/modules/data_import/domain/models/import_result.dart';
import 'package:management_side/src/features/settings/modules/data_import/presentation/providers/data_import_providers.dart';

class DataImportScreen extends ConsumerWidget {
  const DataImportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final importResult = ref.watch(importResultProvider);
    final isImporting = ref.watch(importInProgressProvider);

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
            icon: Icon(Icons.close),
          ),
        ],
      ),
      content: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildImportCard(ref, isImporting),
            const SizedBox(height: 24),
            if (importResult != null) _buildImportResult(importResult),
          ],
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
            const Text(
              'Import Books from Excel',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            const Text(
              'Upload an Excel file to import books into the system. The first row should contain headers.',
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: isImporting ? null : () => _pickAndImportFile(ref),
              icon: const Icon(Icons.upload_file),
              label: Text(isImporting ? 'Importing...' : 'Select Excel File'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  vertical: 12,
                  horizontal: 16,
                ),
              ),
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
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Import Results',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            importResult.when(
              data: (result) => _buildResultDetails(result),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Text(
                'Error: $error',
                style: const TextStyle(color: Colors.red),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultDetails(ImportResult result) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStatRow('Total Rows', result.total.toString()),
        _buildStatRow(
          'Successfully Imported',
          '${result.imported} (${(result.imported / result.total * 100).toStringAsFixed(1)}%)',
          success: true,
        ),
        _buildStatRow(
          'Failed',
          '${result.failed} (${(result.failed / result.total * 100).toStringAsFixed(1)}%)',
          success: false,
          show: result.failed > 0,
        ),
        const SizedBox(height: 16),
        if (result.warnings.isNotEmpty) ...[
          const Text(
            'Warnings:',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.orange),
          ),
          ...result.warnings.map(
            (warning) => Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text('• $warning'),
            ),
          ),
          const SizedBox(height: 16),
        ],
        if (result.errors.isNotEmpty) ...[
          const Text(
            'Errors:',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
          ),
          ...result.errors.map(
            (error) => Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(
                '• $error',
                style: const TextStyle(color: Colors.red),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildStatRow(
    String label,
    String value, {
    bool success = true,
    bool show = true,
  }) {
    if (!show) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: TextStyle(
              color: success ? Colors.green : Colors.red,
              fontWeight: FontWeight.bold,
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
