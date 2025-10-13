import 'package:flutter/material.dart';

class MembershipRequestsScreen extends StatefulWidget {
  const MembershipRequestsScreen({super.key});

  @override
  State<MembershipRequestsScreen> createState() =>
      _MembershipRequestsScreenState();
}

class _MembershipRequestsScreenState extends State<MembershipRequestsScreen> {
  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Membership Requests'));
  }
}
