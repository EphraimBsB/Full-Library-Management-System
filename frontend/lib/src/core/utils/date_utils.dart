class AppDateUtils {
  static String formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  static String formatDateTime(DateTime date) {
    return '${formatDate(date)} ${formatTime(date)}';
  }

  static String formatTime(DateTime date) {
    // Convert to local time as backend usually sends UTC
    final localDate = date.toLocal();
    final hour = localDate.hour == 0
        ? 12
        : (localDate.hour > 12 ? localDate.hour - 12 : localDate.hour);
    final period = localDate.hour < 12 ? 'AM' : 'PM';
    final minute = localDate.minute.toString().padLeft(2, '0');
    return '$hour:$minute $period';
  }
}
