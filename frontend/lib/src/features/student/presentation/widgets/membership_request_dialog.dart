import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/core/utils/file_uploader.dart';
import 'package:management_side/src/features/membership/presentation/providers/membership_request_provider.dart';
import 'package:management_side/src/features/settings/modules/membership-types/presentation/providers/membership_types_providers.dart';
import 'package:management_side/src/features/settings/modules/user-roles/presentation/providers/user_roles_providers.dart';

class MembershipRequestDialog extends ConsumerStatefulWidget {
  const MembershipRequestDialog({Key? key}) : super(key: key);

  @override
  _MembershipRequestDialogState createState() =>
      _MembershipRequestDialogState();
}

class _MembershipRequestDialogState
    extends ConsumerState<MembershipRequestDialog> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _rollNumberController = TextEditingController();
  final _courseController = TextEditingController();
  final _degreeController = TextEditingController();
  final _notesController = TextEditingController();

  File? _profileImage;
  String? _profileImageUrl;
  String? _selectedMembershipTypeId;
  String? _selectedUserRoleId;
  // List<MembershipType> _membershipTypes = [];

  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _isUploading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
  }

  Future<void> _pickAndUploadImage() async {
    try {
      final file = await FileUploader.instance.pickImage();
      if (file == null) return;

      setState(() => _isUploading = true);

      final imageUrl = await FileUploader.instance.uploadImage(file);
      setState(() {
        _profileImage = file;
        _profileImageUrl = imageUrl;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to upload image: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedMembershipTypeId == null) {
      setState(() {
        _errorMessage = 'Please select a membership type';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final repository = ref.read(membershipRequestRepositoryProvider);

      // Upload profile image if selected but not yet uploaded
      if (_profileImage != null && _profileImageUrl == null) {
        try {
          setState(() => _isUploading = true);
          _profileImageUrl = await FileUploader.instance.uploadImage(
            _profileImage!,
          );
        } catch (e) {
          setState(() {
            _errorMessage = 'Failed to upload image: $e';
            _isSubmitting = false;
            _isUploading = false;
          });
          return;
        }
      }

      final data = {
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'email': _emailController.text.trim(),
        'phoneNumber': _phoneController.text.trim(),
        'rollNumber': _rollNumberController.text.trim(),
        'course': _courseController.text.trim(),
        'degree': _degreeController.text.trim(),
        'membershipTypeId': _selectedMembershipTypeId!,
        'profileImageUrl': _profileImageUrl,
        'notes': _notesController.text.trim(),
        'userRoleId': int.parse(_selectedUserRoleId!),
      };

      final result = await repository.createMembershipRequest(data);

      if (!mounted) return;

      result.fold(
        (failure) {
          setState(() => _errorMessage = failure.message);
        },
        (membershipRequest) async {
          await showDialog(
            context: context,
            barrierDismissible: false,
            builder: (context) => AlertDialog(
              title: const Text('Request Submitted'),
              content: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle, color: Colors.green, size: 60),
                  SizedBox(height: 16),
                  Text(
                    'Your membership request has been submitted successfully!',
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Please wait for an approval email from the librarian. You will be notified once your request is processed.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop(); // Close dialog
                    Navigator.of(
                      context,
                    ).pop(true); // Close the form with success
                  },
                  child: const Text('OK'),
                ),
              ],
            ),
          );
        },
      );
    } catch (e) {
      setState(() => _errorMessage = 'Failed to submit request: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _isUploading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _rollNumberController.dispose();
    _courseController.dispose();
    _degreeController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final membershipTypesAsync = ref.watch(membershipTypesNotifierProvider);
    final userRolesAsync = ref.watch(userRolesProvider);
    return AlertDialog(
      title: const Text('Request Membership'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),

              // Profile Image Upload
              Center(
                child: GestureDetector(
                  onTap: _isUploading ? null : _pickAndUploadImage,
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.grey[200],
                    backgroundImage: _profileImage != null
                        ? FileImage(_profileImage!) as ImageProvider
                        : const AssetImage('assets/default_avatar.png'),
                    child: _isUploading
                        ? const CircularProgressIndicator()
                        : _profileImage == null
                        ? const Icon(
                            Icons.add_a_photo,
                            size: 30,
                            color: Colors.grey,
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Personal Information
              const Text(
                'Personal Information',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _firstNameController,
                      decoration: const InputDecoration(
                        labelText: 'First Name *',
                      ),
                      validator: (value) =>
                          value?.isEmpty ?? true ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _lastNameController,
                      decoration: const InputDecoration(
                        labelText: 'Last Name *',
                      ),
                      validator: (value) =>
                          value?.isEmpty ?? true ? 'Required' : null,
                    ),
                  ),
                ],
              ),

              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email *'),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Required';
                  if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(value)) {
                    return 'Enter a valid email';
                  }
                  return null;
                },
              ),

              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: 'Phone Number *'),
                keyboardType: TextInputType.phone,
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Required' : null,
              ),

              const SizedBox(height: 16),

              // Academic Information
              const Text(
                'Academic Information',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),

              TextFormField(
                controller: _rollNumberController,
                decoration: const InputDecoration(labelText: 'Roll Number *'),
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Required' : null,
              ),

              TextFormField(
                controller: _courseController,
                decoration: const InputDecoration(labelText: 'Course *'),
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Required' : null,
              ),

              TextFormField(
                controller: _degreeController,
                decoration: const InputDecoration(labelText: 'Degree *'),
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Required' : null,
              ),

              const SizedBox(height: 16),

              // Membership Type
              const Text(
                'Membership Type',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),

              _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : DropdownButtonFormField<String>(
                      value: _selectedMembershipTypeId,
                      items: membershipTypesAsync.when(
                        data: (types) => types.map((type) {
                          return DropdownMenuItem(
                            value: type.id.toString(),
                            child: Text('${type.name} (${type.description})'),
                          );
                        }).toList(),
                        error: (error, stack) => [],
                        loading: () => [],
                      ),
                      onChanged: (value) {
                        setState(() {
                          _selectedMembershipTypeId = value;
                        });
                      },
                      decoration: const InputDecoration(
                        labelText: 'Select Membership Type *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) => value == null
                          ? 'Please select a membership type'
                          : null,
                    ),
              _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : DropdownButtonFormField<String>(
                      value: _selectedUserRoleId,
                      items: userRolesAsync.when(
                        data: (types) => types.map((type) {
                          return DropdownMenuItem(
                            value: type.id.toString(),
                            child: Text('${type.name} (${type.description})'),
                          );
                        }).toList(),
                        error: (error, stack) => [],
                        loading: () => [],
                      ),
                      onChanged: (value) {
                        setState(() {
                          _selectedUserRoleId = value;
                        });
                      },
                      decoration: const InputDecoration(
                        labelText: 'Select User Role *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) =>
                          value == null ? 'Please select a user role' : null,
                    ),

              const SizedBox(height: 16),

              // Additional Notes
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Additional Notes',
                  hintText: 'Any additional information...',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),

              const SizedBox(height: 24),

              // Submit Button
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submitForm,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Submit Request',
                        style: TextStyle(fontSize: 16, color: Colors.white),
                      ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isSubmitting
              ? null
              : () => Navigator.of(context).pop(false),
          child: const Text('Cancel'),
        ),
      ],
    );
  }
}
