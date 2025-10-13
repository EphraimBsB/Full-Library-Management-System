import 'package:flutter/material.dart';
import 'package:management_side/src/features/books/domain/models/book_enums.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/models/book_type_model.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';

Widget buildTextField({
  required TextEditingController controller,
  required String hint,
  bool isRequired = false,
  TextInputType keyboardType = TextInputType.text,
  int maxLines = 1,
  String? Function(String?)? validator,
  void Function(String)? onChanged,
  bool showAccessNumbersPreview = false,
  BookType? selectedType,
  BookModel? bookModel,
}) {
  final inputDecoration = InputDecoration(
    hintText: hint + (isRequired ? ' *' : ''),
    hintStyle: TextStyle(color: Colors.grey[600], fontSize: 14),
    border: const OutlineInputBorder(
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
      suffixIcon:
          showAccessNumbersPreview &&
              selectedType?.name.toLowerCase() != 'ebook'
          ? ValueListenableBuilder<TextEditingValue>(
              valueListenable: controller,
              builder: (context, value, _) {
                final copies = int.tryParse(value.text) ?? 0;
                if (copies <= 0) return const SizedBox.shrink();

                final accessNumbers = generateAccessNumbers(
                  copies,
                  selectedType,
                );
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
                                  style: Theme.of(context).textTheme.labelSmall
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
List<String> generateAccessNumbers(int totalCopies, BookType? selectedType) {
  if (selectedType?.name.toLowerCase() == 'ebook') {
    return [];
  }

  final now = DateTime.now();
  final prefix = selectedType?.name.isNotEmpty == true
      ? selectedType!.name[0].toUpperCase()
      : 'B';

  return List.generate(
    totalCopies,
    (index) => '$prefix-${now.year}-${(index + 1).toString().padLeft(4, '0')}',
  );
}
