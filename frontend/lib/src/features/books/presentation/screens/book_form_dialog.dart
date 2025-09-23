import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/books/domain/models/book_model.dart';
import 'package:management_side/src/features/books/domain/models/book_enums.dart';

// Common categories and subjects
const List<String> commonCategories = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'Technology',
  'Mathematics',
  'History',
  'Biography',
  'Self-Help',
  'Business',
  'Art',
  'Music',
  'Literature',
  'Reference',
  'Religion',
  'Philosophy',
];

const List<String> commonSubjects = [
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Mathematics',
  'Engineering',
  'Medicine',
  'Economics',
  'Law',
  'Psychology',
  'Sociology',
  'Political Science',
  'Education',
  'Languages',
  'Literature',
];

class BookFormDialog extends StatefulWidget {
  final Book? book;
  final Function(Book) onSubmit;

  const BookFormDialog({super.key, this.book, required this.onSubmit});

  @override
  State<BookFormDialog> createState() => _BookFormDialogState();
}

class _BookFormDialogState extends State<BookFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _authorController;
  late TextEditingController _descriptionController;
  late TextEditingController _ddcController;
  late TextEditingController _isbnController;
  late TextEditingController _editionController;
  late TextEditingController _copiesController;
  late TextEditingController _publisherController;
  late TextEditingController _pubYearController;
  late TextEditingController _fromController;
  late TextEditingController _imageUrlController;
  late TextEditingController _ebookUrlController;
  late TextEditingController _locationController;
  late TextEditingController _shelfController;
  late TextEditingController _accessNumbersController;

  // Dropdown values
  String? _selectedCategory;
  List<String> _selectedSubjects = [];
  BookType _selectedType = BookType.physical;
  BookSource _selectedSource = BookSource.purchased;

  @override
  void initState() {
    super.initState();
    final book = widget.book;
    _titleController = TextEditingController(text: book?.title ?? '');
    _authorController = TextEditingController(text: book?.author ?? '');
    _descriptionController = TextEditingController(
      text: book?.description ?? '',
    );
    _ddcController = TextEditingController();
    _isbnController = TextEditingController(text: book?.isbn ?? '');
    _editionController = TextEditingController(text: book?.edition ?? '');
    _copiesController = TextEditingController(
      text: book?.totalCopies.toString() ?? '',
    );
    _publisherController = TextEditingController(text: book?.publisher ?? '');
    _pubYearController = TextEditingController(
      text: book?.publicationYear.toString() ?? '',
    );
    _fromController = TextEditingController(text: book?.from ?? '');
    _imageUrlController = TextEditingController(
      text: book?.coverImageUrl ?? '',
    );
    _ebookUrlController = TextEditingController(text: book?.ebookUrl ?? '');
    _locationController = TextEditingController(text: book?.location ?? '');
    _shelfController = TextEditingController(text: book?.shelf ?? '');
    _accessNumbersController = TextEditingController(
      text: book?.accessNumbers.isNotEmpty == true
          ? book!.accessNumbers.join(', ')
          : '',
    );

    // Initialize dropdown values
    _selectedCategory =
        book?.categories.isNotEmpty == true &&
            commonCategories.contains(book!.categories.first)
        ? book.categories.first
        : null;
    _selectedSubjects = book?.subjects ?? [];
    _selectedType = book?.type ?? BookType.physical;
    _selectedSource = book?.source ?? BookSource.purchased;

    // Initialize dropdown values
    if (book != null) {
      _selectedCategory =
          book.categories.isNotEmpty &&
              commonCategories.contains(book.categories.first)
          ? book.categories.first
          : null;
      _selectedSubjects = List.from(book.subjects);
      _selectedType = book.type;
      _selectedSource = book.source;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _authorController.dispose();
    _descriptionController.dispose();
    _ddcController.dispose();
    _isbnController.dispose();
    _editionController.dispose();
    _copiesController.dispose();
    _publisherController.dispose();
    _pubYearController.dispose();
    _fromController.dispose();
    _imageUrlController.dispose();
    _ebookUrlController.dispose();
    _locationController.dispose();
    _shelfController.dispose();
    _accessNumbersController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState?.validate() ?? false) {
      if (_selectedCategory == null || _selectedCategory!.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select a category')),
        );
        return;
      }

      if (_selectedSubjects.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select at least one subject')),
        );
        return;
      }

      final book = Book(
        id: widget.book?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: _titleController.text.trim(),
        author: _authorController.text.trim(),
        isbn: _isbnController.text.trim(),
        publisher: _publisherController.text.trim().isNotEmpty
            ? _publisherController.text.trim()
            : null,
        publicationYear:
            int.tryParse(_pubYearController.text.trim()) ?? DateTime.now().year,
        edition: _editionController.text.trim().isNotEmpty
            ? _editionController.text.trim()
            : null,
        totalCopies: int.tryParse(_copiesController.text.trim()) ?? 1,
        availableCopies:
            widget.book?.availableCopies ??
            int.tryParse(_copiesController.text.trim()) ??
            1,
        description: _descriptionController.text.trim().isNotEmpty
            ? _descriptionController.text.trim()
            : null,
        coverImageUrl: _imageUrlController.text.trim().isNotEmpty
            ? _imageUrlController.text.trim()
            : null,
        categories: [_selectedCategory!],
        subjects: _selectedSubjects,
        type: _selectedType,
        source: _selectedSource,
        ddc: _ddcController.text.trim().isNotEmpty
            ? _ddcController.text.trim()
            : null,
        from: _fromController.text.trim().isNotEmpty
            ? _fromController.text.trim()
            : null,
        ebookUrl: _ebookUrlController.text.trim().isNotEmpty
            ? _ebookUrlController.text.trim()
            : null,
        location: _locationController.text.trim().isNotEmpty
            ? _locationController.text.trim()
            : null,
        shelf: _shelfController.text.trim().isNotEmpty
            ? _shelfController.text.trim()
            : null,
        accessNumbers: _generateAccessNumbers(
          int.tryParse(_copiesController.text.trim()) ?? 1,
        ),
        createdAt: widget.book?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );
      widget.onSubmit(book);
      if (mounted) {
        Navigator.of(context).pop();
      }
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _imageUrlController.text = pickedFile.path;
      });
    }
  }

  Future<void> _pickEbook() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'epub'],
    );

    if (result != null) {
      setState(() {
        _ebookUrlController.text = result.files.single.path!;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final isSmallScreen = screenSize.width < 1000;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      backgroundColor: AppTheme.backgroundColor,
      child: Container(
        width: isSmallScreen ? screenSize.width * 0.9 : 1000,
        height: screenSize.height * 0.9,
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    widget.book == null ? 'Add New Book' : 'Edit Book',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      // Main Content Row
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Left Column
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildSectionHeader('Basic Information'),
                                _buildTextField(
                                  controller: _titleController,
                                  hint: 'Title *',
                                  isRequired: true,
                                ),
                                const SizedBox(height: 8),
                                _buildTextField(
                                  controller: _authorController,
                                  hint: 'Author *',
                                  isRequired: true,
                                ),
                                const SizedBox(height: 8),
                                _buildTextField(
                                  controller: _isbnController,
                                  hint: 'ISBN *',
                                  isRequired: true,
                                ),
                                const SizedBox(height: 8),
                                _buildTextField(
                                  controller: _ddcController,
                                  hint: 'DDC (Dewey Decimal Classification)',
                                ),
                                const SizedBox(height: 8),
                                _buildTextField(
                                  controller: _editionController,
                                  hint: 'Edition',
                                ),
                                const SizedBox(height: 8),
                                _buildCategoryField(),
                                const SizedBox(height: 8),
                                _buildMultiSelectDropdown(
                                  selectedItems: _selectedSubjects,
                                  items: commonSubjects,
                                  hint: 'Select Subjects',
                                  onChanged: (value) {
                                    setState(() {
                                      _selectedSubjects = value;
                                    });
                                  },
                                ),
                                _buildSectionHeader('Publication Details'),
                                _buildTextField(
                                  controller: _publisherController,
                                  hint: 'Publisher',
                                ),
                                const SizedBox(height: 8),
                                _buildTextField(
                                  controller: _pubYearController,
                                  hint: 'Publication Year *',
                                  keyboardType: TextInputType.number,
                                  isRequired: true,
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Required';
                                    }
                                    if (int.tryParse(value) == null) {
                                      return 'Invalid year';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 8),
                                _buildTypeField(),
                                const SizedBox(height: 8),
                                _buildSourceField(),
                                const SizedBox(height: 8),
                                _buildTextField(
                                  controller: _fromController,
                                  hint: 'From (e.g., Donor Name)',
                                ),
                                const SizedBox(height: 8),
                              ],
                            ),
                          ),

                          // Right Column
                          const SizedBox(width: 24),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildSectionHeader('Location & Copies'),
                                _buildTextField(
                                  controller: _locationController,
                                  hint: 'Location',
                                ),
                                const SizedBox(height: 8),
                                _buildTextField(
                                  controller: _shelfController,
                                  hint: 'Shelf',
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      flex: 2,
                                      child: _buildTextField(
                                        controller: _copiesController,
                                        hint: 'Total Copies *',
                                        isRequired: true,
                                        keyboardType: TextInputType.number,
                                        showAccessNumbersPreview: false,
                                        validator: (value) {
                                          if (value == null || value.isEmpty) {
                                            return 'Required';
                                          }
                                          final n = int.tryParse(value);
                                          if (n == null || n <= 0) {
                                            return 'Invalid number';
                                          }
                                          return null;
                                        },
                                      ),
                                    ),
                                    if (_selectedType != BookType.ebook) ...[
                                      const SizedBox(width: 16),
                                      Expanded(
                                        flex: 3,
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Access Numbers Preview:',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    color: Theme.of(
                                                      context,
                                                    ).hintColor,
                                                  ),
                                            ),
                                            const SizedBox(height: 4),
                                            ValueListenableBuilder<
                                              TextEditingValue
                                            >(
                                              valueListenable:
                                                  _copiesController,
                                              builder: (context, value, _) {
                                                final copies =
                                                    int.tryParse(value.text) ??
                                                    0;
                                                if (copies <= 0) {
                                                  return Text(
                                                    'Enter number of copies to see access numbers',
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .bodySmall
                                                        ?.copyWith(
                                                          color: Theme.of(
                                                            context,
                                                          ).hintColor,
                                                          fontStyle:
                                                              FontStyle.italic,
                                                        ),
                                                  );
                                                }
                                                final accessNumbers =
                                                    _generateAccessNumbers(
                                                      copies,
                                                    );
                                                return Wrap(
                                                  spacing: 4,
                                                  runSpacing: 4,
                                                  children: [
                                                    ...accessNumbers
                                                        .take(10)
                                                        .map(
                                                          (number) => Chip(
                                                            label: Text(number),
                                                            backgroundColor:
                                                                Theme.of(
                                                                      context,
                                                                    )
                                                                    .colorScheme
                                                                    .surfaceVariant,
                                                            padding:
                                                                EdgeInsets.zero,
                                                            labelPadding:
                                                                const EdgeInsets.symmetric(
                                                                  horizontal: 8,
                                                                  vertical: 0,
                                                                ),
                                                            labelStyle:
                                                                Theme.of(
                                                                      context,
                                                                    )
                                                                    .textTheme
                                                                    .labelSmall,
                                                          ),
                                                        ),
                                                    if (copies > 10)
                                                      Chip(
                                                        label: Text(
                                                          '+${copies - 10} more',
                                                        ),
                                                        backgroundColor:
                                                            Theme.of(context)
                                                                .colorScheme
                                                                .surfaceVariant,
                                                        padding:
                                                            EdgeInsets.zero,
                                                        labelPadding:
                                                            const EdgeInsets.symmetric(
                                                              horizontal: 8,
                                                              vertical: 0,
                                                            ),
                                                        labelStyle:
                                                            Theme.of(context)
                                                                .textTheme
                                                                .labelSmall
                                                                ?.copyWith(
                                                                  color: Theme.of(
                                                                    context,
                                                                  ).hintColor,
                                                                ),
                                                      ),
                                                  ],
                                                );
                                              },
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                _buildSectionHeader('Media'),
                                const SizedBox(height: 4),
                                TextFormField(
                                  controller: _imageUrlController,
                                  decoration: InputDecoration(
                                    hintText: 'Image URL or select file',
                                    border: const OutlineInputBorder(),
                                    isDense: true,
                                    contentPadding: const EdgeInsets.all(12),
                                    suffixIcon: IconButton(
                                      icon: const Icon(Icons.upload_file),
                                      onPressed: _pickImage,
                                      tooltip: 'Upload image',
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextFormField(
                                  controller: _ebookUrlController,
                                  decoration: InputDecoration(
                                    hintText: 'E-book file (PDF/EPUB)',
                                    border: const OutlineInputBorder(),
                                    isDense: true,
                                    contentPadding: const EdgeInsets.all(12),
                                    suffixIcon: IconButton(
                                      icon: const Icon(Icons.upload_file),
                                      onPressed: _pickEbook,
                                      tooltip: 'Select e-book file',
                                    ),
                                  ),
                                ),

                                _buildSectionHeader('Description'),
                                _buildTextField(
                                  controller: _descriptionController,
                                  hint: 'Book description...',
                                  maxLines: 8,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: _submitForm,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                    ),
                    child: const Text('Save'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Colors.blue,
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    bool isRequired = false,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
    bool showAccessNumbersPreview = false,
  }) {
    final inputDecoration = InputDecoration(
      hintText: hint + (isRequired ? ' *' : ''),
      hintStyle: TextStyle(color: Colors.grey[600], fontSize: 14),
      border: const OutlineInputBorder(
        borderSide: BorderSide(color: Colors.grey),
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      enabledBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: Colors.grey),
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      focusedBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: Colors.blue, width: 2),
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      filled: true,
      fillColor: Colors.grey[50],
      errorStyle: const TextStyle(fontSize: 12),
      errorMaxLines: 2,
    );

    return TextFormField(
      controller: controller,
      decoration: inputDecoration.copyWith(
        suffixIcon: showAccessNumbersPreview && _selectedType != BookType.ebook
            ? ValueListenableBuilder<TextEditingValue>(
                valueListenable: controller,
                builder: (context, value, _) {
                  final copies = int.tryParse(value.text) ?? 0;
                  if (copies <= 0) return const SizedBox.shrink();

                  final accessNumbers = _generateAccessNumbers(copies);
                  return Container(
                    width: 200,
                    padding: const EdgeInsets.only(right: 8, left: 16),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ...accessNumbers
                              .take(5)
                              .map(
                                (number) => Container(
                                  margin: const EdgeInsets.only(left: 4),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.surfaceVariant,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    number,
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelSmall
                                        ?.copyWith(fontSize: 10),
                                  ),
                                ),
                              ),
                          if (copies > 5)
                            Container(
                              margin: const EdgeInsets.only(left: 4),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Theme.of(
                                  context,
                                ).colorScheme.surfaceVariant,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '+${copies - 5} more',
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(
                                      fontSize: 10,
                                      color: Theme.of(context).hintColor,
                                    ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              )
            : inputDecoration.suffixIcon,
      ),
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator:
          validator ??
          (isRequired
              ? (value) {
                  if (value == null || value.isEmpty) {
                    return 'This field is required';
                  }
                  if (onChanged != null) onChanged(value);
                  return null;
                }
              : onChanged != null
              ? (value) {
                  onChanged(value ?? '');
                  return null;
                }
              : null),
    );
  }

  // Generate access numbers based on total copies (e.g., 3 copies -> ["001", "002", "003"])
  List<String> _generateAccessNumbers(int totalCopies) {
    if (_selectedType == BookType.ebook) {
      return [];
    }
    return List.generate(
      totalCopies,
      (index) => (index + 1).toString().padLeft(3, '0'),
    );
  }

  Widget _buildCategoryField() {
    return DropdownButtonFormField<String>(
      value: _selectedCategory,
      decoration: const InputDecoration(
        labelText: 'Category *',
        border: OutlineInputBorder(),
      ),
      items: commonCategories.map((category) {
        return DropdownMenuItem<String>(value: category, child: Text(category));
      }).toList(),
      onChanged: (value) {
        setState(() {
          _selectedCategory = value;
        });
      },
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please select a category';
        }
        return null;
      },
    );
  }

  Widget _buildTypeField() {
    return DropdownButtonFormField<BookType>(
      value: _selectedType,
      decoration: const InputDecoration(
        labelText: 'Book Type *',
        border: OutlineInputBorder(),
      ),
      items: BookType.values.map((type) {
        return DropdownMenuItem<BookType>(
          value: type,
          child: Text(type.toString().split('.').last),
        );
      }).toList(),
      onChanged: (value) {
        if (value != null) {
          setState(() {
            _selectedType = value;
          });
        }
      },
      validator: (value) {
        if (value == null) {
          return 'Please select a book type';
        }
        return null;
      },
    );
  }

  Widget _buildSourceField() {
    return DropdownButtonFormField<BookSource>(
      value: _selectedSource,
      decoration: const InputDecoration(
        labelText: 'Source *',
        border: OutlineInputBorder(),
      ),
      items: BookSource.values.map((source) {
        return DropdownMenuItem<BookSource>(
          value: source,
          child: Text(source.toString().split('.').last),
        );
      }).toList(),
      onChanged: (value) {
        if (value != null) {
          setState(() {
            _selectedSource = value;
          });
        }
      },
      validator: (value) {
        if (value == null) {
          return 'Please select a source';
        }
        return null;
      },
    );
  }

  Widget _buildMultiSelectDropdown({
    required List<String> selectedItems,
    required List<String> items,
    required String hint,
    required Function(List<String>) onChanged,
    bool isRequired = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InputDecorator(
          decoration: InputDecoration(
            hintText: hint + (isRequired ? ' *' : ''),
            border: const OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(8)),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 12,
            ),
            filled: true,
            fillColor: Colors.grey[50],
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              hint: Text(
                hint + (isRequired ? ' *' : ''),
                style: TextStyle(color: Colors.grey[600]),
              ),
              items: items.map((item) {
                return DropdownMenuItem<String>(
                  value: item,
                  child: Row(
                    children: [
                      Checkbox(
                        value: selectedItems.contains(item),
                        onChanged: (bool? value) {
                          setState(() {
                            if (value == true) {
                              selectedItems.add(item);
                            } else {
                              selectedItems.remove(item);
                            }
                            onChanged(List<String>.from(selectedItems));
                          });
                        },
                      ),
                      Expanded(
                        child: Text(item, overflow: TextOverflow.ellipsis),
                      ),
                    ],
                  ),
                );
              }).toList(),
              onChanged: (_) {},
            ),
          ),
        ),
        if (selectedItems.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Wrap(
              spacing: 8.0,
              runSpacing: 4.0,
              children: selectedItems.map((item) {
                return Chip(
                  label: Text(item),
                  deleteIcon: const Icon(Icons.close, size: 16),
                  onDeleted: () {
                    setState(() {
                      selectedItems.remove(item);
                      onChanged(List<String>.from(selectedItems));
                    });
                  },
                );
              }).toList(),
            ),
          ),
      ],
    );
  }
}

void showBookFormDialog({
  required BuildContext context,
  Book? book,
  required Function(Book) onSubmit,
}) {
  showDialog(
    context: context,
    builder: (context) => BookFormDialog(book: book, onSubmit: onSubmit),
  );
}
