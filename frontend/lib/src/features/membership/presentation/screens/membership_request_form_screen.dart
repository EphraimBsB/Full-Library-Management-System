import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/utils/file_uploader.dart';
import 'package:management_side/src/features/membership/domain/models/membership_request_model.dart';
import 'package:management_side/src/features/membership/presentation/providers/membership_request_provider.dart';
import 'package:management_side/src/features/settings/modules/degrees/domain/models/degree_model.dart';
import 'package:management_side/src/features/settings/modules/degrees/presentation/providers/degree_providers.dart';
import 'package:management_side/src/features/settings/modules/membership-types/presentation/providers/membership_types_providers.dart';
import 'package:management_side/src/features/settings/modules/user-roles/presentation/providers/user_roles_providers.dart';

void showMembershipRequestFormDialog(
  BuildContext context, {
  MembershipRequest? initialData,
}) {
  showDialog(
    context: context,
    builder: (context) => Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 800, maxHeight: 700),
        child: MembershipRequestFormDialog(initialData: initialData),
      ),
    ),
  );
}

class MembershipRequestFormDialog extends ConsumerStatefulWidget {
  final MembershipRequest? initialData;

  const MembershipRequestFormDialog({Key? key, this.initialData})
    : super(key: key);

  @override
  ConsumerState<MembershipRequestFormDialog> createState() =>
      _MembershipRequestFormDialogState();
}

class _MembershipRequestFormDialogState
    extends ConsumerState<MembershipRequestFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _rollNumberController = TextEditingController();
  final _notesController = TextEditingController();
  final _degreeController = TextEditingController();

  File? _profileImage;
  String? _profileImageUrl;
  String? _selectedMembershipTypeId;
  String? _selectedUserRoleId;
  Degree? _selectedDegree;
  bool _isSubmitting = false;
  bool _isUploading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      final request = widget.initialData!;
      _firstNameController.text = request.user.firstName!;
      _lastNameController.text = request.user.lastName!;
      _emailController.text = request.user.email!;
      _phoneController.text = request.user.phoneNumber!;
      _rollNumberController.text = request.user.rollNumber!;
      _degreeController.text = request.user.degree!;
      _notesController.text = request.notes ?? '';
      _profileImageUrl = request.user.avatarUrl;
      _selectedMembershipTypeId = request.membershipTypeId.toString();
    }

    // Load degrees
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(degreesNotifierProvider.notifier).refresh();
    });
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _rollNumberController.dispose();
    _degreeController.dispose();
    _notesController.dispose();
    super.dispose();
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
      setState(() => _errorMessage = 'Please select a membership type');
      return;
    }
    if (_selectedUserRoleId == null) {
      setState(() => _errorMessage = 'Please select a user role');
      return;
    }
    if (_selectedDegree == null) {
      setState(() => _errorMessage = 'Please select a degree');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final repository = ref.read(membershipRequestRepositoryProvider);
      final data = {
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'email': _emailController.text.trim(),
        'phoneNumber': _phoneController.text.trim(),
        'rollNumber': _rollNumberController.text.trim(),
        'degree': _selectedDegree?.code ?? '',
        'membershipTypeId': int.parse(_selectedMembershipTypeId!),
        'avatarUrl': _profileImageUrl,
        'notes': _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : null,
        'roleId': int.parse(_selectedUserRoleId!),
      };

      final result = await repository.createMembershipRequest(data);

      if (!mounted) return;

      result.fold(
        (failure) {
          setState(() => _errorMessage = failure.message);
        },
        (_) {
          ref.invalidate(membershipRequestNotifierProvider);
          Navigator.of(context).pop(true);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Membership request submitted successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        },
      );
    } catch (e) {
      setState(() => _errorMessage = 'Failed to submit request: $e');
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final membershipTypesAsync = ref.watch(membershipTypesNotifierProvider);
    final userRolesAsync = ref.watch(userRolesProvider);
    final degreesAsync = ref.watch(degreesNotifierProvider);
    final isEditing = widget.initialData != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Request' : 'New Membership Request'),
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Profile Image Upload
              Center(
                child: GestureDetector(
                  onTap: _isUploading ? null : _pickAndUploadImage,
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.grey[200],
                    backgroundImage: _profileImage != null
                        ? FileImage(_profileImage!)
                        : (_profileImageUrl != null
                                  ? NetworkImage(_profileImageUrl!)
                                  : null)
                              as ImageProvider?,
                    child: _isUploading
                        ? const CircularProgressIndicator()
                        : _profileImage == null && _profileImageUrl == null
                        ? const Icon(
                            Icons.add_a_photo,
                            size: 32,
                            color: Colors.grey,
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    _errorMessage!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.error,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              // Form Fields
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _firstNameController,
                      decoration: const InputDecoration(
                        labelText: 'First Name *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) =>
                          value?.trim().isEmpty ?? true ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _lastNameController,
                      decoration: const InputDecoration(
                        labelText: 'Last Name *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) =>
                          value?.trim().isEmpty ?? true ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'Email *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value?.trim().isEmpty ?? true) return 'Required';
                  if (!RegExp(r'^[^@]+@[^\s]+\.[^\s]+$').hasMatch(value!)) {
                    return 'Enter a valid email';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(
                  labelText: 'Phone Number *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
                validator: (value) =>
                    value?.trim().isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _rollNumberController,
                decoration: const InputDecoration(labelText: 'Roll Number *'),
                validator: (value) =>
                    value?.trim().isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              degreesAsync.when(
                data: (degrees) {
                  final activeDegrees = degrees
                      .where((d) => d.isActive)
                      .toList();
                  if (activeDegrees.isEmpty) {
                    return const Text('No degrees available');
                  }

                  return Autocomplete<Degree>(
                    optionsBuilder: (TextEditingValue textEditingValue) {
                      if (textEditingValue.text == '') {
                        return const Iterable<Degree>.empty();
                      }
                      return activeDegrees.where(
                        (degree) => degree.name.toLowerCase().contains(
                          textEditingValue.text.toLowerCase(),
                        ),
                      );
                    },
                    displayStringForOption: (Degree option) => option.name,
                    fieldViewBuilder:
                        (
                          BuildContext context,
                          TextEditingController textEditingController,
                          FocusNode focusNode,
                          VoidCallback onFieldSubmitted,
                        ) {
                          return TextField(
                            controller: textEditingController,
                            focusNode: focusNode,
                            decoration: InputDecoration(
                              labelText: 'Programs *',
                              hintText: 'Type to search programs...',
                              border: const OutlineInputBorder(
                                borderRadius: BorderRadius.all(
                                  Radius.circular(8),
                                ),
                              ),
                              suffixIcon: IconButton(
                                icon: const Icon(
                                  Icons.search,
                                  size: 20,
                                  color: Colors.grey,
                                ),
                                onPressed: () {
                                  // Toggle the dropdown when the icon is pressed
                                  FocusScope.of(
                                    context,
                                  ).requestFocus(focusNode);
                                },
                              ),
                            ),
                          );
                        },
                    onSelected: (Degree selection) {
                      setState(() {
                        _selectedDegree = selection;
                        _degreeController.text = selection.name;
                      });
                    },
                  );
                },
                loading: () => const LinearProgressIndicator(),
                error: (error, _) => Text('Error loading degrees: $error'),
              ),
              const SizedBox(height: 16),
              // Membership Type Dropdown
              membershipTypesAsync.when(
                data: (types) {
                  final activeTypes = types.where((t) => t.isActive).toList();
                  if (activeTypes.isEmpty) {
                    return const Text('No membership types available');
                  }
                  return DropdownButtonFormField<String>(
                    initialValue: _selectedMembershipTypeId ??= activeTypes
                        .first
                        .id
                        .toString(),
                    decoration: const InputDecoration(
                      labelText: 'Membership Type *',
                    ),
                    items: activeTypes.map((type) {
                      return DropdownMenuItem<String>(
                        value: type.id.toString(),
                        child: Text(type.name),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedMembershipTypeId = value;
                      });
                    },
                    validator: (value) => value == null
                        ? 'Please select a membership type'
                        : null,
                  );
                },
                loading: () => const LinearProgressIndicator(),
                error: (error, _) =>
                    Text('Error loading membership types: $error'),
              ),
              const SizedBox(height: 16),

              // User Role Dropdown
              userRolesAsync.when(
                data: (roles) {
                  if (roles.isEmpty) {
                    return const Text('No user roles available');
                  }

                  // Filter out admin and librarian roles
                  final filteredRoles = roles
                      .where(
                        (role) => ![
                          'admin',
                          'librarian',
                        ].contains(role.name.toLowerCase()),
                      )
                      .toList();

                  if (filteredRoles.isEmpty) {
                    return const Text('No valid roles available');
                  }

                  // Add null check and fallback for initialValue
                  final initialRoleId =
                      _selectedUserRoleId ?? filteredRoles.first.id.toString();

                  return DropdownButtonFormField<String>(
                    initialValue: _selectedUserRoleId ?? initialRoleId,
                    decoration: const InputDecoration(labelText: 'User Role *'),
                    items: filteredRoles.map((role) {
                      return DropdownMenuItem<String>(
                        value: role.id.toString(),
                        child: Text(role.name),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedUserRoleId = value;
                      });
                    },
                    validator: (value) =>
                        value == null && _selectedUserRoleId == null
                        ? 'Please select a user role'
                        : null,
                  );
                },
                loading: () => const LinearProgressIndicator(),
                error: (error, _) => Text('Error loading user roles: $error'),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _isSubmitting ? null : _submitForm,
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(isEditing ? 'Update Request' : 'Submit Request'),
              ),
              if (isEditing) ...[
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: _isSubmitting
                      ? null
                      : () async {
                          final confirmed = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: const Text('Delete Request'),
                              content: const Text(
                                'Are you sure you want to delete this request?',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.pop(context, false),
                                  child: const Text('Cancel'),
                                ),
                                TextButton(
                                  onPressed: () => Navigator.pop(context, true),
                                  child: const Text(
                                    'Delete',
                                    style: TextStyle(color: Colors.red),
                                  ),
                                ),
                              ],
                            ),
                          );

                          if (confirmed == true) {
                            try {
                              await ref
                                  .read(membershipRequestRepositoryProvider)
                                  .deleteMembershipRequest(
                                    widget.initialData!.id,
                                  );
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Request deleted'),
                                  ),
                                );
                                Navigator.of(context).pop();
                              }
                            } catch (e) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Failed to delete request: $e',
                                    ),
                                  ),
                                );
                              }
                            }
                          }
                        },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: theme.colorScheme.error,
                    side: BorderSide(color: theme.colorScheme.error),
                  ),
                  child: const Text('Delete Request'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
