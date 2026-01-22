import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/locations/domain/models/location_model.dart';
import 'package:management_side/src/features/settings/modules/locations/presentation/providers/location_providers.dart';
import 'package:management_side/src/features/settings/modules/locations/presentation/screens/location_dialog.dart';
import 'package:management_side/src/features/settings/presentation/widgets/build_expandable_items.dart';

class LocationsExpanded extends ConsumerWidget {
  const LocationsExpanded({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationsAsync = ref.watch(locationsNotifierProvider);

    return buildExpandableSettingItem(
      icon: Icons.location_on,
      title: 'Locations',
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Add Location'),
              onPressed: () => _showLocationDialog(context, ref, null),
            ),
          ),
          const SizedBox(height: 8),
          locationsAsync.when(
            data: (locations) => locations.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('No locations found'),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: locations.length,
                    itemBuilder: (context, index) {
                      final location = locations[index];
                      return _buildLocationItem(context, ref, location);
                    },
                  ),
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: CircularProgressIndicator(),
              ),
            ),
            error: (error, stack) => Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text('Error loading locations: $error'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationItem(
    BuildContext context,
    WidgetRef ref,
    Location location,
  ) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      elevation: 0,
      color: Colors.grey.shade50,
      child: ListTile(
        title: Text(
          location.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        subtitle: location.address != null
            ? Text(
                location.address!,
                style: const TextStyle(fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              )
            : null,
        trailing: IconButton(
          icon: const Icon(
            Icons.remove_red_eye_outlined,
            size: 20,
            color: Colors.grey,
          ),
          onPressed: () => _showLocationDialog(context, ref, location),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );
  }

  Future<void> _showLocationDialog(
    BuildContext context,
    WidgetRef ref,
    Location? location,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => LocationDialog(location: location),
    );

    if (result == true && context.mounted) {
      ref.invalidate(locationsNotifierProvider);
    }
  }
}
