// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:management_side/src/features/loans/presentation/screens/loan_list_screen.dart';

void main() {
  testWidgets('LoanListScreen smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: LoanListScreen(),
        ),
      ),
    );

    // Verify that the screen title is displayed
    expect(find.text('Loan Management'), findsOneWidget);
    
    // Verify that the search field is present
    expect(find.byType(TextField), findsOneWidget);
    
    // Verify that the add button is present
    expect(find.byIcon(Icons.add), findsOneWidget);
  });
}
