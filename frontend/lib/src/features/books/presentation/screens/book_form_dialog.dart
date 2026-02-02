// import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/core/utils/file_uploader.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/models/book_copy.dart';
import 'package:management_side/src/features/books/domain/services/worldcat_service.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_book_types_autocomplete.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_categories_autocomplete.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_media_input.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_section_header.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_sources_autocomplete.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_subjects_autocomplete.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_text_field.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/models/source_model.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/models/book_type_model.dart';
import 'package:management_side/src/features/books/presentation/providers/book_list_providers.dart';
import 'package:management_side/src/features/books/presentation/providers/paginated_books_provider.dart';
import 'package:management_side/src/features/books/presentation/providers/book_details_provider.dart';
import 'package:management_side/src/features/dashboard/presentation/providers/dashboard_summary_provider.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/models/category_model.dart';
import 'package:management_side/src/features/settings/modules/subjects/domain/models/subject_model.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_publishers.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_locations.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_shelves.dart';
import 'package:management_side/src/core/utils/error_handler.dart';

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
      text: book?.totalCopies.toString() ?? '',
    );
    _publisherController = TextEditingController(text: book?.publisher ?? '');
    _pubYearController = TextEditingController(
      text: book?.publicationYear.toString() ?? '',
    );
    _fromController = TextEditingController(text: book?.source?.supplier ?? '');
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
      text: book?.copies!.isNotEmpty == true
          ? book!.copies!.map((copy) => copy.accessNumber.toString()).join(', ')
          : '',
    );

    // Initialize selected type and source if editing
    if (book != null) {
      _selectedType = book.type is BookType ? book.type : null;
      _selectedSource = book.source is Source ? book.source : null;
    }

    // Initialize category and subjects
    _selectedCategorys =
        book?.categories != null && book!.categories!.isNotEmpty
        ? book.categories!.map<Category>((s) => s).toList()
        : <Category>[];

    _selectedSubjects = book?.subjects != null && book!.subjects!.isNotEmpty
        ? book.subjects!.map<Subject>((s) => s).toList()
        : <Subject>[];
  }

  // Dropdown values
  List<Category> _selectedCategorys = [];
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

  Future<void> _autoFillFromISBN() async {
    final isbn = _isbnController.text.trim();

    if (isbn.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an ISBN number first')),
      );
      return;
    }

    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const AlertDialog(
        content: Row(
          children: [
            CircularProgressIndicator(),
            SizedBox(width: 16),
            Text('Fetching book information...'),
          ],
        ),
      ),
    );

    try {
      // Try Google Books API first (free, no API key required)
      final bookData = await WorldCatService.fetchBookByISBNFromGoogle(isbn);

      if (bookData != null) {
        // Populate form fields with fetched data
        _titleController.text = bookData.title;
        _authorController.text = bookData.author;
        _descriptionController.text = bookData.description ?? '';
        _ddcController.text = bookData.ddc ?? '';
        _publisherController.text = bookData.publisher ?? '';
        _pubYearController.text = bookData.publicationYear?.toString() ?? '';
        _imageUrlController.text = bookData.coverImageUrl ?? '';

        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Book information fetched successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      // Show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${ErrorHandler.getErrorMessage(e)}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      // Close loading dialog
      Navigator.of(context).pop();
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedCategorys.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please select a category')));
      return;
    }

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
        'categories': _selectedCategorys
            .map(
              (category) => {'name': category.name},
            ) // Only include name for categories
            .toList(),
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
        'copies': _generateBookCopies(),
      };

      // Remove null values to match DTO
      bookData.removeWhere((key, value) => value == null);

      final bookRepository = ref.read(bookRepositoryProvider);
      final result = widget.book != null
          ? await bookRepository.updateBook(
              BookModel.fromJson(bookData),
              widget.book!.id!,
            )
          : await bookRepository.createBook(BookModel.fromJson(bookData));

      if (mounted) {
        if (result.isSuccess) {
          final savedBook =
              result.successOrNull!; // Get the book returned from API

          // Instant local updates for both providers
          if (widget.book != null) {
            // Update
            ref.read(booksNotifierProvider.notifier).updateBook(savedBook);
            ref.read(paginatedBooksProvider.notifier).updateBook(savedBook);
            ref.invalidate(bookDetailsProvider(widget.book!.id!));
          } else {
            // Create
            ref.read(booksNotifierProvider.notifier).addBook(savedBook);
            ref.read(paginatedBooksProvider.notifier).addBook(savedBook);
          }

          // Still invalidate dashboard as it's complex to update locally
          ref.invalidate(dashboardSummaryProvider);

          // Force refresh the current page
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
          final error = result.failureOrNull;
          final errorMessage = ErrorHandler.getErrorMessage(error);

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        final errorMessage = ErrorHandler.getErrorMessage(e);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {}
    }
  }

  List<Map<String, dynamic>> _generateBookCopies() {
    final copies = <Map<String, dynamic>>[];
    final accessNumbersText = _accessNumbersController.text.trim();
    final count = int.tryParse(_copiesController.text.trim()) ?? 1;

    // Get existing copies for reference
    final existingCopies = widget.book?.copies ?? <BookCopy>[];

    if (accessNumbersText.isEmpty) {
      // If no access numbers provided, generate default ones
      for (var i = 0; i < count; i++) {
        final existingCopy = i < existingCopies.length
            ? existingCopies[i]
            : null;
        copies.add({
          if (existingCopy != null) 'id': existingCopy.id,
          'accessNumber': (i + 1).toString().padLeft(3, '0'),
          'notes': 'Copy ${i + 1} of ${_titleController.text.trim()}',
        });
      }
    } else {
      // Parse manually entered access numbers
      final accessNumbers = accessNumbersText
          .split(',')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();

      // Ensure we have enough access numbers for the total copies
      for (var i = 0; i < count; i++) {
        final existingCopy = i < existingCopies.length
            ? existingCopies[i]
            : null;
        if (i < accessNumbers.length) {
          copies.add({
            if (existingCopy != null) 'id': existingCopy.id,
            'accessNumber': accessNumbers[i],
            'notes': 'Copy ${i + 1} of ${_titleController.text.trim()}',
          });
        } else {
          // If not enough access numbers, generate default ones for remaining copies
          copies.add({
            if (existingCopy != null) 'id': existingCopy.id,
            'accessNumber': (i + 1).toString().padLeft(3, '0'),
            'notes': 'Copy ${i + 1} of ${_titleController.text.trim()}',
          });
        }
      }
    }

    return copies;
  }

  Future<void> _pickAndUploadImage() async {
    try {
      final file = await FileUploader.instance.pickImage();
      if (file == null) return;

      final imageUrl = await FileUploader.instance.uploadImage(file);
      setState(() {
        _imageUrlController.text = imageUrl;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ErrorHandler.getErrorMessage(e))),
        );
      }
    } finally {
      if (mounted) {}
    }
  }

  Future<void> _pickAndUploadEbook() async {
    try {
      final file = await FileUploader.instance.pickDocument();
      if (file == null) return;

      final ebookUrl = await FileUploader.instance.uploadDocument(file);
      setState(() {
        _ebookUrlController.text = ebookUrl;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ErrorHandler.getErrorMessage(e))),
        );
      }
    } finally {
      if (mounted) {}
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
                                Row(
                                  children: [
                                    Expanded(
                                      child: buildTextField(
                                        controller: _isbnController,
                                        hint: 'ISBN *',
                                        isRequired: true,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      onPressed: _autoFillFromISBN,
                                      icon: const Icon(Icons.search),
                                      tooltip: 'Auto-fill from ISBN',
                                      style: IconButton.styleFrom(
                                        backgroundColor: Theme.of(
                                          context,
                                        ).colorScheme.primary,
                                        foregroundColor: Theme.of(
                                          context,
                                        ).colorScheme.onPrimary,
                                      ),
                                    ),
                                  ],
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
                                CategoriesAutocomplete(
                                  selectedCategories: _selectedCategorys,
                                  onCategorySelected: (category) {
                                    setState(() {
                                      _selectedCategorys.add(category);
                                    });
                                  },
                                  onCategoryRemoved: (category) {
                                    setState(() {
                                      _selectedCategorys.remove(category);
                                    });
                                  },
                                ),
                                const SizedBox(height: 8),
                                SubjectsAutocomplete(
                                  selectedSubjects: _selectedSubjects,
                                  onSubjectSelected: (subject) {
                                    setState(() {
                                      if (!_selectedSubjects.any(
                                        (s) => s.id == subject.id,
                                      )) {
                                        _selectedSubjects.add(subject);
                                      }
                                    });
                                  },
                                  onSubjectRemoved: (subject) {
                                    setState(() {
                                      _selectedSubjects.remove(subject);
                                    });
                                  },
                                ),
                                buildSectionHeader('Description'),
                                buildTextField(
                                  controller: _descriptionController,
                                  hint: 'Book description...',
                                  maxLines: 9,
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
                                PublisherAutocomplete(
                                  controller: _publisherController,
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
                                BookTypeAutocomplete(
                                  selectedBookType: _selectedType,
                                  onBookTypeSelected: (value) =>
                                      setState(() => _selectedType = value),
                                ),
                                const SizedBox(height: 8),
                                SourceAutocomplete(
                                  selectedSource: _selectedSource,
                                  onSourceSelected: (value) => setState(() {
                                    _selectedSource = value;
                                    _fromController.text =
                                        value?.supplier ?? '';
                                  }),
                                ),
                                const SizedBox(height: 8),
                                buildTextField(
                                  controller: _fromController,
                                  hint: 'From (e.g., Donor Name)',
                                ),
                                const SizedBox(height: 8),
                                buildTextField(
                                  controller: _priceController,
                                  hint: 'Book Price (optional)',
                                  keyboardType: TextInputType.number,
                                ),
                                buildSectionHeader('Location & Copies'),
                                LocationAutocomplete(
                                  controller: _locationController,
                                ),
                                const SizedBox(height: 8),
                                ShelfAutocomplete(controller: _shelfController),
                                const SizedBox(height: 16),
                                buildTextField(
                                  controller: _copiesController,
                                  hint: 'Total Copies *',
                                  isRequired: true,
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Required';
                                    }
                                    final copies = int.tryParse(value);
                                    if (copies == null || copies <= 0) {
                                      return 'Enter a valid number';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                                buildTextField(
                                  controller: _accessNumbersController,
                                  hint:
                                      'Access Numbers (comma-separated, optional)',
                                  keyboardType: TextInputType.text,
                                  validator: (value) {
                                    final copies =
                                        int.tryParse(
                                          _copiesController.text.trim(),
                                        ) ??
                                        0;
                                    if (value != null && value.isNotEmpty) {
                                      final accessNumbers = value
                                          .split(',')
                                          .map((s) => s.trim())
                                          .where((s) => s.isNotEmpty)
                                          .toList();
                                      if (accessNumbers.length > copies) {
                                        return 'More access numbers than total copies';
                                      }
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Enter access numbers separated by commas (e.g., 001, 002, 003). If left empty, access numbers will be generated automatically.',
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(
                                        color: Colors.grey[600],
                                        fontSize: 12,
                                      ),
                                ),

                                // const SizedBox(height: 8),
                                buildSectionHeader('Media'),
                                buildMediaInput(
                                  controller: _imageUrlController,
                                  hintText: 'Cover image - optional',
                                  validator: (value) {
                                    // No validation - cover image is optional
                                    return null;
                                  },
                                  onPickAndUpload: _pickAndUploadImage,
                                ),
                                const SizedBox(height: 8),
                                buildMediaInput(
                                  controller: _ebookUrlController,
                                  hintText: 'E-book file (PDF/EPUB) - optional',
                                  validator: (value) {
                                    // No validation - ebook is optional
                                    return null;
                                  },
                                  onPickAndUpload: _pickAndUploadEbook,
                                ),

                                const SizedBox(height: 8),
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
}

void showBookFormDialog({required BuildContext context, BookModel? book}) {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => BookFormDialog(book: book),
  );
}
