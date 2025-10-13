// import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';

import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/core/utils/file_uploader.dart';
import 'package:management_side/src/features/books/domain/models/book_copy.dart';
import 'package:management_side/src/features/books/domain/models/book_details.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_book_types.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_sources.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/models/source_model.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/models/book_type_model.dart';
import 'package:management_side/src/features/settings/modules/book_types/presentation/providers/book/book_type_providers.dart';
import 'package:management_side/src/features/settings/modules/book_sources/presentation/providers/source_providers.dart';
import 'package:management_side/src/features/books/presentation/providers/book_list_providers.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_categories.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_section_header.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_subjects.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_text_field.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/models/category_model.dart';
import 'package:management_side/src/features/settings/modules/categories/presentation/providers/category_providers.dart';
import 'package:management_side/src/features/settings/modules/subjects/domain/models/subject_model.dart';
import 'package:management_side/src/features/settings/modules/subjects/presentation/providers/subject_providers.dart';

class BookFormDialog extends ConsumerStatefulWidget {
  final BookModel? book;

  const BookFormDialog({super.key, this.book});

  @override
  ConsumerState<BookFormDialog> createState() => _BookFormDialogState();
}

class _BookFormDialogState extends ConsumerState<BookFormDialog> {
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
  late TextEditingController _priceController;
  late TextEditingController _imageUrlController;
  late TextEditingController _ebookUrlController;
  late TextEditingController _locationController;
  late TextEditingController _shelfController;
  late TextEditingController _accessNumbersController;

  // Track file upload state
  bool _isUploading = false;
  bool _isSubmitting = false;

  // Selected book type and source
  BookType? _selectedType;
  Source? _selectedSource;

  // No need to store these as fields, we'll use ref.watch in the build methods

  @override
  void initState() {
    super.initState();
    final book = widget.book;

    // Initialize all controllers
    _titleController = TextEditingController(text: book?.title ?? '');
    _authorController = TextEditingController(text: book?.author ?? '');
    _descriptionController = TextEditingController(
      text: book?.description ?? '',
    );
    _ddcController = TextEditingController(text: book?.ddc ?? '');
    _isbnController = TextEditingController(text: book?.isbn ?? '');
    _editionController = TextEditingController(text: book?.edition ?? '');
    _copiesController = TextEditingController(
      text: book?.totalCopies.toString() ?? '1',
    );
    _publisherController = TextEditingController(text: book?.publisher ?? '');
    _pubYearController = TextEditingController(
      text: book?.publicationYear.toString() ?? '',
    );
    _fromController = TextEditingController();
    _priceController = TextEditingController(
      text: book?.price?.toString() ?? '',
    );
    _imageUrlController = TextEditingController(
      text: book?.coverImageUrl ?? '',
    );
    _ebookUrlController = TextEditingController(text: book?.ebookUrl ?? '');
    _locationController = TextEditingController(text: book?.location ?? '');
    _shelfController = TextEditingController(text: book?.shelf ?? '');
    _accessNumbersController = TextEditingController(
      text: book?.copies.isNotEmpty == true
          ? book!.copies.map((copy) => copy.accessNumber.toString()).join(', ')
          : '',
    );

    // // Always load book types and sources
    // ref.read(bookTypesNotifierProvider.notifier).loadBookTypes();
    // ref.read(sourcesNotifierProvider.notifier).loadSources();

    // Initialize selected type and source if editing
    if (book != null) {
      _selectedType = book.type is BookType ? book.type : null;
      _selectedSource = book.source is Source ? book.source : null;
    }

    // Initialize category and subjects
    _selectedCategory = book?.categories.isNotEmpty == true
        ? book!.categories.first is Category
              ? book.categories.first
              : Category.fromJson(book.categories.first as Map<String, dynamic>)
        : null;

    _selectedSubjects = book?.subjects.isNotEmpty == true
        ? book!.subjects
              .map<Subject>(
                (s) => s is Subject
                    ? s
                    : Subject.fromJson(s as Map<String, dynamic>),
              )
              .toList()
        : <Subject>[];
  }

  File? _pickedImage;
  File? _pickedEbook;

  // Dropdown values
  Category? _selectedCategory;
  List<Subject> _selectedSubjects = [];

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
    _priceController.dispose();
    _imageUrlController.dispose();
    _ebookUrlController.dispose();
    _locationController.dispose();
    _shelfController.dispose();
    _accessNumbersController.dispose();
    super.dispose();
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedCategory == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please select a category')));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final bookData = {
        'title': _titleController.text.trim(),
        'author': _authorController.text.trim(),
        'isbn': _isbnController.text.trim().isNotEmpty
            ? _isbnController.text.trim()
            : null,
        'publisher': _publisherController.text.trim().isNotEmpty
            ? _publisherController.text.trim()
            : null,
        'publicationYear': _pubYearController.text.trim().isNotEmpty
            ? int.tryParse(_pubYearController.text.trim())
            : null,
        'edition': _editionController.text.trim().isNotEmpty
            ? _editionController.text.trim()
            : null,
        'totalCopies': int.tryParse(_copiesController.text.trim()) ?? 1,
        'description': _descriptionController.text.trim().isNotEmpty
            ? _descriptionController.text.trim()
            : null,
        'coverImageUrl': _imageUrlController.text.trim().isNotEmpty
            ? _imageUrlController.text.trim()
            : null,
        'categories': [
          {'name': _selectedCategory!.name}, // Only include name for categories
        ],
        'subjects': _selectedSubjects
            .map(
              (subject) => {'name': subject.name},
            ) // Only include name for subjects
            .toList(),
        'typeId': _selectedType?.id,
        'sourceId': _selectedSource?.id,
        'ddc': _ddcController.text.trim().isNotEmpty
            ? _ddcController.text.trim()
            : null,
        'price': _priceController.text.trim().isNotEmpty
            ? _priceController.text.trim()
            : null,
        'ebookUrl': _ebookUrlController.text.trim().isNotEmpty
            ? _ebookUrlController.text.trim()
            : null,
        'location': _locationController.text.trim().isNotEmpty
            ? _locationController.text.trim()
            : null,
        'shelf': _shelfController.text.trim().isNotEmpty
            ? _shelfController.text.trim()
            : null,
        'copies': _generateBookCopies()
            .map(
              (copy) => {
                'accessNumber': copy['accessNumber'],
                'notes': copy['notes'],
              },
            )
            .toList(),
      };

      // Remove null values to match DTO
      bookData.removeWhere((key, value) => value == null);

      final bookRepository = ref.read(bookRepositoryProvider);
      final result = widget.book != null
          ? await bookRepository.updateBook(BookModel.fromJson(bookData))
          : await bookRepository.createBook(BookModel.fromJson(bookData));

      if (mounted) {
        if (result.isSuccess) {
          await ref.refresh(allBooksProvider.future);
          if (mounted) {
            Navigator.of(context).pop(true);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Book ${widget.book != null ? 'updated' : 'created'} successfully',
                ),
                backgroundColor: Colors.green,
              ),
            );
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: $result'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e, stackTrace) {
      debugPrint('Error in _submitForm: $e\n$stackTrace');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('An error occurred: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  List<Map<String, dynamic>> _generateBookCopies() {
    final copies = <Map<String, dynamic>>[];
    final count = int.tryParse(_copiesController.text.trim()) ?? 1;

    for (var i = 0; i < count; i++) {
      copies.add({
        'accessNumber': (i + 1).toString().padLeft(3, '0'),
        'notes': 'Copy ${i + 1} of ${_titleController.text.trim()}',
      });
    }

    return copies;
  }

  Future<void> _pickAndUploadImage() async {
    try {
      final file = await FileUploader.instance.pickImage();
      if (file == null) return;

      setState(() => _isUploading = true);

      final imageUrl = await FileUploader.instance.uploadImage(file);
      setState(() {
        _imageUrlController.text = imageUrl;
        _pickedImage = file;
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

  Future<void> _pickAndUploadEbook() async {
    try {
      final file = await FileUploader.instance.pickDocument();
      if (file == null) return;

      setState(() => _isUploading = true);

      final ebookUrl = await FileUploader.instance.uploadDocument(file);
      setState(() {
        _ebookUrlController.text = ebookUrl;
        _pickedEbook = file;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to upload ebook: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  // Generate access numbers for book copies
  List<String> generateAccessNumbers(int count, BookType? type) {
    return List.generate(
      count,
      (index) => (index + 1).toString().padLeft(3, '0'),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final isSmallScreen = screenSize.width < 1000;
    final categories = ref.watch(categoriesNotifierProvider);
    final subjects = ref.watch(subjectsNotifierProvider);
    final bookTypes = ref.watch(bookTypesNotifierProvider);
    final sources = ref.watch(sourcesNotifierProvider);

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
                                buildSectionHeader('Basic Information'),
                                buildTextField(
                                  controller: _titleController,
                                  hint: 'Title *',
                                  isRequired: true,
                                ),
                                const SizedBox(height: 8),
                                buildTextField(
                                  controller: _authorController,
                                  hint: 'Author *',
                                  isRequired: true,
                                ),
                                const SizedBox(height: 8),
                                buildTextField(
                                  controller: _isbnController,
                                  hint: 'ISBN *',
                                  isRequired: true,
                                ),
                                const SizedBox(height: 8),
                                buildTextField(
                                  controller: _ddcController,
                                  hint: 'DDC (Dewey Decimal Classification)',
                                ),
                                const SizedBox(height: 8),
                                buildTextField(
                                  controller: _editionController,
                                  hint: 'Edition',
                                ),
                                const SizedBox(height: 8),
                                buildCategoryField(
                                  categories,
                                  _selectedCategory,
                                  (value) =>
                                      setState(() => _selectedCategory = value),
                                ),
                                const SizedBox(height: 8),
                                buildSubjectsField(
                                  subjects,
                                  _selectedSubjects,
                                  (value) => setState(
                                    () => _selectedSubjects.add(value!),
                                  ),
                                  (value) => setState(
                                    () => _selectedSubjects.remove(value),
                                  ),
                                ),
                                // _buildMultiSelectDropdown(
                                //   selectedItems: _selectedSubjects,
                                //   items: commonSubjects,
                                //   hint: 'Select Subjects',
                                //   onChanged: (value) {
                                //     setState(() {
                                //       _selectedSubjects = value;
                                //     });
                                //   },
                                // ),
                                buildSectionHeader('Description'),
                                buildTextField(
                                  controller: _descriptionController,
                                  hint: 'Book description...',
                                  maxLines: 8,
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
                                buildSectionHeader('Publication Details'),
                                buildTextField(
                                  controller: _publisherController,
                                  hint: 'Publisher',
                                ),
                                const SizedBox(height: 8),
                                buildTextField(
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
                                buildBookTypesField(
                                  bookTypes,
                                  _selectedType,
                                  (value) =>
                                      setState(() => _selectedType = value),
                                ),
                                const SizedBox(height: 8),
                                buildSourcesField(
                                  sources,
                                  _selectedSource,
                                  (value) =>
                                      setState(() => _selectedSource = value),
                                ),
                                const SizedBox(height: 8),
                                buildTextField(
                                  controller: _fromController,
                                  hint: 'From (e.g., Donor Name)',
                                ),
                                const SizedBox(height: 8),
                                buildTextField(
                                  controller: _priceController,
                                  hint: 'Book Price',
                                  keyboardType: TextInputType.number,
                                ),
                                buildSectionHeader('Location & Copies'),
                                buildTextField(
                                  controller: _locationController,
                                  hint: 'Location',
                                ),
                                const SizedBox(height: 8),
                                buildTextField(
                                  controller: _shelfController,
                                  hint: 'Shelf',
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      flex: 2,
                                      child: buildTextField(
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
                                    if (_selectedType != 'boo') ...[
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
                                                    generateAccessNumbers(
                                                      copies,
                                                      _selectedType,
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
                                buildSectionHeader('Media'),
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
                                      onPressed: _pickAndUploadImage,
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
                                      onPressed: _pickAndUploadEbook,
                                      tooltip: 'Select e-book file',
                                    ),
                                  ),
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

  Widget _buildTypeField() {
    final bookTypesAsync = ref.watch(bookTypesNotifierProvider);
    return bookTypesAsync.when(
      data: (bookTypes) {
        // If no book types are available, show a message
        if (bookTypes.isEmpty) {
          return const Text('No book types available');
        }

        // If editing and type is not set but book has a type, try to find it
        if (widget.book != null &&
            _selectedType == null &&
            widget.book!.type != null) {
          _selectedType = bookTypes.firstWhere(
            (type) => type.id == widget.book!.type?.id,
            orElse: () => bookTypes.firstWhere(
              (type) => type.name == widget.book!.type?.toString(),
              orElse: () => bookTypes.first,
            ),
          );
        }

        // If still no type is selected, use the first one by default
        _selectedType ??= bookTypes.isNotEmpty ? bookTypes.first : null;

        return DropdownButtonFormField<BookType>(
          value: _selectedType,
          decoration: const InputDecoration(
            labelText: 'Book Type *',
            border: OutlineInputBorder(),
            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          ),
          isExpanded: true,
          items: bookTypes.map((type) {
            return DropdownMenuItem<BookType>(
              value: type,
              child: Text(type.name, overflow: TextOverflow.ellipsis),
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
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) {
        // Log the error for debugging
        debugPrint('Error loading book types: $error');
        return Text(
          'Failed to load book types',
          style: TextStyle(color: Theme.of(context).colorScheme.error),
        );
      },
    );
  }

  Widget _buildSourceField() {
    final sourcesAsync = ref.watch(sourcesNotifierProvider);
    return sourcesAsync.when(
      data: (sources) {
        // If no sources are available, show a message
        if (sources.isEmpty) {
          return const Text('No sources available');
        }

        // If editing and source is not set but book has a source, try to find it
        if (widget.book != null &&
            _selectedSource == null &&
            widget.book!.source != null) {
          _selectedSource = sources.firstWhere(
            (source) => source.id == widget.book!.source?.id,
            orElse: () => sources.firstWhere(
              (source) => source.name == widget.book!.source?.toString(),
              orElse: () => sources.first,
            ),
          );
        }

        // If still no source is selected, use the first one by default
        _selectedSource ??= sources.isNotEmpty ? sources.first : null;

        return DropdownButtonFormField<Source>(
          value: _selectedSource,
          decoration: const InputDecoration(
            labelText: 'Source *',
            border: OutlineInputBorder(),
            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          ),
          isExpanded: true,
          items: sources.map((source) {
            return DropdownMenuItem<Source>(
              value: source,
              child: Text(source.name, overflow: TextOverflow.ellipsis),
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
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) {
        // Log the error for debugging
        debugPrint('Error loading sources: $error');
        return Text(
          'Failed to load sources',
          style: TextStyle(color: Theme.of(context).colorScheme.error),
        );
      },
    );
  }
}

void showBookFormDialog({required BuildContext context, BookModel? book}) {
  showDialog(
    context: context,
    builder: (context) => BookFormDialog(book: book),
  );
}
