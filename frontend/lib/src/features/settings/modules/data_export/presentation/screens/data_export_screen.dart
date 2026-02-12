import 'dart:developer' as dev;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/core/utils/file_downloader.dart';
import 'package:management_side/src/core/network/api_constants.dart';

class DataExportScreen extends ConsumerStatefulWidget {
  const DataExportScreen({super.key});

  @override
  ConsumerState<DataExportScreen> createState() => _DataExportScreenState();
}

class _DataExportScreenState extends ConsumerState<DataExportScreen> {
  bool _isExporting = false;
  String _selectedModule = 'books';
  String _selectedFileName = 'export_report';
  String? _userToken;

  final List<Map<String, String>> _exportModules = [
    {'value': 'books', 'label': 'Books', 'icon': '📚'},
    {'value': 'loans', 'label': 'Loans', 'icon': '📖'},
    {'value': 'users', 'label': 'Users', 'icon': '👥'},
    {'value': 'requests', 'label': 'Book Requests', 'icon': '📋'},
  ];

  @override
  void initState() {
    super.initState();
    _getUserToken();
  }

  void _getUserToken() async {
    // Implement your logic to retrieve the user's auth token here
    // This could be from secure storage, shared preferences, or auth state
    _userToken = await _getTokenFromStorage();
    setState(() {});
  }

  Future<String> _getTokenFromStorage() async {
    // Implement your logic to retrieve the token from storage
    // This could be from flutter_secure_storage, shared_preferences, or your auth provider
    // For demonstration purposes, return a dummy token
    return 'dummy_user_token';
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.backgroundColor,
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text('Data Export'),
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
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildModuleSelector(),
              const SizedBox(height: 16),
              _buildFileNameInput(),
              const SizedBox(height: 24),
              _buildExportButton(),
              if (_isExporting) ...[
                const SizedBox(height: 16),
                _buildProgressIndicator(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModuleSelector() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select Module to Export',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ..._exportModules.map(
              (module) => RadioListTile<String>(
                title: Row(
                  children: [
                    Text(module['icon']!, style: const TextStyle(fontSize: 20)),
                    const SizedBox(width: 12),
                    Text(module['label']!),
                  ],
                ),
                value: module['value']!,
                groupValue: _selectedModule,
                onChanged: (value) {
                  setState(() {
                    _selectedModule = value!;
                    _updateDefaultFileName(value);
                  });
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFileNameInput() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'File Name',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              decoration: const InputDecoration(
                hintText: 'Enter file name (without extension)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.edit_document),
              ),
              onChanged: (value) {
                setState(() {
                  _selectedFileName = value;
                });
              },
              controller: TextEditingController(text: _selectedFileName),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExportButton() {
    return ElevatedButton.icon(
      onPressed: _isExporting ? null : _showConfirmationDialog,
      icon: _isExporting
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            )
          : const Icon(Icons.file_download),
      label: Text(_isExporting ? 'Exporting...' : 'Export Data'),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text(
              'Exporting data...',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            const LinearProgressIndicator(),
            const SizedBox(height: 8),
            Text(
              'Please wait while we generate your Excel file.',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  void _updateDefaultFileName(String module) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    setState(() {
      switch (module) {
        case 'books':
          _selectedFileName = 'books_report_$timestamp';
          break;
        case 'loans':
          _selectedFileName = 'loans_report_$timestamp';
          break;
        case 'users':
          _selectedFileName = 'users_report_$timestamp';
          break;
        case 'requests':
          _selectedFileName = 'requests_report_$timestamp';
          break;
        default:
          _selectedFileName = 'export_report_$timestamp';
      }
    });
  }

  void _showConfirmationDialog() {
    final selectedModuleData = _exportModules.firstWhere(
      (module) => module['value'] == _selectedModule,
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirm Export'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Are you sure you want to export ${selectedModuleData['label']} data?',
            ),
            const SizedBox(height: 8),
            Text(
              'This will export all ${selectedModuleData['label']?.toLowerCase() ?? 'data'} from the system.',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _exportData();
            },
            child: const Text('Export'),
          ),
        ],
      ),
    );
  }

  Future<void> _exportData() async {
    setState(() => _isExporting = true);

    try {
      final fileName = '$_selectedFileName.xlsx';
      final url = _getExportUrl(_selectedModule);

      dev.log('Starting export for module: $_selectedModule');
      dev.log('Export URL: $url');
      dev.log('File name: $fileName');

      await FileDownloader.instance.downloadFile(
        url,
        fileName,
        authToken: _userToken,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${_exportModules.firstWhere((m) => m['value'] == _selectedModule)['label']} exported successfully!',
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      dev.log('Export error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to export data: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isExporting = false);
      }
    }
  }

  String _getExportUrl(String module) {
    switch (module) {
      case 'books':
        return '${ApiConstants.baseUrl}/reports/books/export';
      case 'loans':
        return '${ApiConstants.baseUrl}/reports/loans/export';
      case 'users':
        return '${ApiConstants.baseUrl}/reports/users/export';
      case 'requests':
        return '${ApiConstants.baseUrl}/reports/requests/export';
      default:
        return '${ApiConstants.baseUrl}/reports/books/export';
    }
  }
}

// Helper function to show export dialog
void showDataExportDialog(BuildContext context) {
  showDialog(context: context, builder: (context) => DataExportScreen());
}
