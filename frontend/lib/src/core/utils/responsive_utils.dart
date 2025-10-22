import 'package:flutter/material.dart';

class ResponsiveUtils {
  // Screen size breakpoints
  static const double mobileBreakpoint = 600;
  static const double tabletBreakpoint = 900;
  static const double desktopBreakpoint = 1200;

  // Check current screen type
  static ScreenType getScreenType(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width < mobileBreakpoint) return ScreenType.mobile;
    if (width < tabletBreakpoint) return ScreenType.tablet;
    if (width < desktopBreakpoint) return ScreenType.smallDesktop;
    return ScreenType.largeDesktop;
  }

  // Get responsive grid settings
  static GridSettings getGridSettings(BuildContext context) {
    final screenType = getScreenType(context);
    
    switch (screenType) {
      case ScreenType.mobile:
        return const GridSettings(
          crossAxisCount: 1,
          childAspectRatio: 1.4,
          spacing: 10,
          mainAxisExtent: 180,
        );
      case ScreenType.tablet:
        return const GridSettings(
          crossAxisCount: 2,
          childAspectRatio: 1.6,
          spacing: 20,
          mainAxisExtent: 200,
        );
      case ScreenType.smallDesktop:
        return const GridSettings(
          crossAxisCount: 3,
          childAspectRatio: 1.8,
          spacing: 25,
          mainAxisExtent: 220,
        );
      case ScreenType.largeDesktop:
        return const GridSettings(
          crossAxisCount: 3,
          childAspectRatio: 2.0,
          spacing: 30,
          mainAxisExtent: 240,
        );
    }
  }

  // Check if current screen is mobile
  static bool isMobile(BuildContext context) => 
      getScreenType(context) == ScreenType.mobile;

  // Check if current screen is tablet
  static bool isTablet(BuildContext context) => 
      getScreenType(context) == ScreenType.tablet;

  // Check if current screen is desktop
  static bool isDesktop(BuildContext context) => 
      getScreenType(context) == ScreenType.smallDesktop || 
      getScreenType(context) == ScreenType.largeDesktop;
}

// Screen type enum
enum ScreenType {
  mobile,     // < 600px
  tablet,     // 600px - 899px
  smallDesktop, // 900px - 1199px
  largeDesktop, // >= 1200px
}

// Grid settings model
class GridSettings {
  final int crossAxisCount;
  final double childAspectRatio;
  final double spacing;
  final double? mainAxisExtent;

  const GridSettings({
    required this.crossAxisCount,
    required this.childAspectRatio,
    required this.spacing,
    this.mainAxisExtent,
  });
}
