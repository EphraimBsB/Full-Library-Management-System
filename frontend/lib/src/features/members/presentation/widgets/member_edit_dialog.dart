import 'package:flutter/material.dart';
import 'package:management_side/src/features/users/domain/models/user_model.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/core/utils/date_utils.dart';

class MemberEditDialog extends StatefulWidget {
  final User? member;
  final Function(User) onSave;

  const MemberEditDialog({
    Key? key,
    this.member,
    required this.onSave,
  }) : super(key: key);

  @override
  _MemberEditDialogState createState() => _MemberEditDialogState();
}

class _MemberEditDialogState extends State<MemberEditDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;
  late TextEditingController _rollNumberController;
  late TextEditingController _phoneController;
  late TextEditingController _courseController;
  late TextEditingController _degreeController;
  DateTime? _dateOfBirth;
  DateTime? _expiryDate;
  bool _isActive = true;

  @override
  void initState() {
    super.initState();
    final member = widget.member;
    _firstNameController = TextEditingController(text: member?.firstName ?? '');
    _lastNameController = TextEditingController(text: member?.lastName ?? '');
    _emailController = TextEditingController(text: member?.email ?? '');
    _rollNumberController = TextEditingController(text: member?.rollNumber ?? '');
    _phoneController = TextEditingController(text: member?.phoneNumber ?? '');
    _courseController = TextEditingController(text: member?.course ?? '');
    _degreeController = TextEditingController(text: member?.degree ?? '');
    _dateOfBirth = member?.dateOfBirth;
    _expiryDate = member?.expiryDate ?? DateTime.now().add(const Duration(days: 365));
    _isActive = member?.isActive ?? true;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _rollNumberController.dispose();
    _phoneController.dispose();
    _courseController.dispose();
    _degreeController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, bool isBirthDate) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isBirthDate ? _dateOfBirth ?? DateTime(2000) : _expiryDate ?? DateTime.now(),
      firstDate: isBirthDate ? DateTime(1900) : DateTime.now(),
      lastDate: isBirthDate ? DateTime.now() : DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        if (isBirthDate) {
          _dateOfBirth = picked;
        } else {
          _expiryDate = picked;
        }
      });
    }
  }

  void _submitForm() {
    if (_formKey.currentState?.validate() ?? false) {
      final member = User(
        id: widget.member?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        email: _emailController.text.trim(),
        rollNumber: _rollNumberController.text.trim(),
        phoneNumber: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
        course: _courseController.text.trim().isNotEmpty ? _courseController.text.trim() : null,
        degree: _degreeController.text.trim().isNotEmpty ? _degreeController.text.trim() : null,
        dateOfBirth: _dateOfBirth,
        createdAt: widget.member?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
        isActive: _isActive,
        joinDate: widget.member?.joinDate ?? DateTime.now(),
        expiryDate: _expiryDate,
        borrowedBooks: widget.member?.borrowedBooks,
      );
      widget.onSave(member);
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.member != null;
    
    return AlertDialog(
      title: Text(isEditing ? 'Edit Member' : 'Add New Member'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildTextField(
                label: 'First Name *',
                controller: _firstNameController,
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'Last Name *',
                controller: _lastNameController,
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'Email *',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value?.isEmpty ?? true) return 'Required';
                  if (!value!.contains('@')) return 'Enter a valid email';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'Roll Number *',
                controller: _rollNumberController,
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'Phone Number',
                controller: _phoneController,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'Course',
                controller: _courseController,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'Degree',
                controller: _degreeController,
              ),
              const SizedBox(height: 12),
              _buildDateField(
                label: 'Date of Birth',
                date: _dateOfBirth,
                onTap: () => _selectDate(context, true),
              ),
              const SizedBox(height: 12),
              _buildDateField(
                label: 'Membership Expiry Date *',
                date: _expiryDate,
                onTap: () => _selectDate(context, false),
                isRequired: true,
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('Active Member'),
                value: _isActive,
                onChanged: (value) => setState(() => _isActive = value),
                activeColor: AppTheme.primaryColor,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('CANCEL'),
        ),
        ElevatedButton(
          onPressed: _submitForm,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
          ),
          child: const Text('SAVE'),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      keyboardType: keyboardType,
      validator: validator,
    );
  }

  Widget _buildDateField({
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
    bool isRequired = false,
  }) {
    return InkWell(
      onTap: onTap,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: isRequired ? '$label *' : label,
          border: const OutlineInputBorder(),
          suffixIcon: const Icon(Icons.calendar_today),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        ),
        child: Text(
          date != null ? AppDateUtils.formatDate(date) : 'Select a date',
          style: TextStyle(
            color: date != null ? null : Colors.grey[600],
          ),
        ),
      ),
    );
  }
}

// Helper extension for date formatting
extension DateFormatter on DateTime {
  String formatDate() {
    return '${day.toString().padLeft(2, '0')}/${month.toString().padLeft(2, '0')}/$year';
  }
}
