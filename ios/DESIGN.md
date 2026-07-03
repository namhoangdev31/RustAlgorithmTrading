# ExploreSwiftUI — API Design Reference

> **Purpose**: This document is an exhaustive reference for AI agents and developers integrating with the `ExploreSwiftUI` library. It catalogs every public component, view modifier (bridge), enum, and utility — organized by functional domain — so that agents can generate correct, idiomatic code without reading the full source.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Platform Utilities](#1-platform-utilities)
3. [Common Enums & Tokens](#2-common-enums--tokens)
4. [Components (Concrete Views)](#3-components-concrete-views)
5. [Bridges (View Modifiers & Extensions)](#4-bridges-view-modifiers--extensions)
6. [Usage Patterns for AI Agents](#5-usage-patterns-for-ai-agents)

---

## Architecture Overview

```
Sources/ExploreSwiftUI/
├── ExploreSwiftUI.swift      # Platform utilities, conditional View extensions
├── Common/
│   └── UniEnums.swift         # All shared enum types (design tokens)
├── Components/                # Concrete View structs (drop-in replacements)
│   ├── UniButton.swift
│   ├── UniAsyncImage.swift
│   ├── ... (32 files)
└── Bridges/                   # View modifier extensions on View, Text, etc.
    ├── UniAlerts.swift
    ├── UniButtons.swift
    ├── ... (26 files)
```

### Design Principles

| Principle | Description |
|:---|:---|
| **Prefix Convention** | All public APIs use the `uni` or `Uni` prefix to avoid collisions with native SwiftUI. |
| **Graceful Degradation** | Every component checks `#available` at runtime and falls back to a polyfill on older OS versions. |
| **Compile-time Platform Guards** | APIs unavailable on certain platforms (e.g., `DisclosureGroup` on tvOS/watchOS) use `#if os(...)` guards. |
| **Zero Side-Effects** | Using a `Uni*` component never disrupts the parent view layout, binding hierarchy, or data flow. |

### Minimum Deployment Targets

| Platform | Minimum |
|:---|:---|
| iOS | 15.0 |
| macOS | 15.0 |
| tvOS | 15.0 |
| watchOS | 8.0 |
| visionOS | 1.0 |

---

## 1. Platform Utilities

**File**: `ExploreSwiftUI.swift`

### `UniOSGeneration` (Enum)

Represents major iOS version milestones.

| Case | Raw Value |
|:---|:---|
| `.v15` | 15 |
| `.v16` | 16 |
| `.v17` | 17 |
| `.v18` | 18 |
| `.v26` | 26 |
| `.v27` | 27 |

### `UniPlatformVersion` (Enum — static methods)

| Method | Description |
|:---|:---|
| `isAtLeast(_ version: UniOSGeneration) -> Bool` | Checks if current OS major version ≥ given generation. |
| `isAvailable(iOS:macOS:tvOS:watchOS:visionOS:) -> Bool` | Major-version check across all platforms. |
| `isAvailable(iOS:macOS:tvOS:watchOS:visionOS:) -> Bool` | Major+minor tuple version check. |
| `runIf(_ condition:action:)` | Conditionally executes a block. |
| `runIf(_:then:else:) -> T` | Conditional with fallback branch. |

**Convenience Properties:**

| Property | Equivalent Check |
|:---|:---|
| `supportsWWDC25Design` | iOS 26 / macOS 26 |
| `supportsWWDC26Design` | iOS 27 / macOS 27 |
| `supportsTabContentAPI` | iOS 18 / macOS 15 |
| `supportsAdaptableTabCustomization` | iOS 18 / macOS 15 |
| `supportsAdvancedSheetPresentation` | iOS 16.4 / macOS 13.3 |
| `supportsAdvancedListAPI` | iOS 17 / macOS 14 |
| `supportsAdvancedPickerAPI` | iOS 17 / macOS 14 |

### `View.if` (Conditional Modifiers)

```swift
// Single branch
Text("Hello").if(condition) { $0.bold() }

// Dual branch
Text("Hello").if(condition, then: { $0.bold() }, else: { $0.italic() })
```

---

## 2. Common Enums & Tokens

**File**: `Common/UniEnums.swift`

### Label & Text

| Enum | Cases |
|:---|:---|
| `UniLabelStyleType` | `.automatic`, `.iconOnly`, `.titleAndIcon`, `.titleOnly` |
| `UniNumberFormat` | `.currency(code:)`, `.percent`, `.decimal(fractionLength:grouping:scientific:)` |
| `UniMeasurementWidth` | `.wide`, `.narrow`, `.abbreviated` |
| `UniTimePattern` | `.hourMinute`, `.minuteSecond` |

### Button & Control

| Enum | Cases |
|:---|:---|
| `UniButtonRole` | `.cancel`, `.close`, `.confirm`, `.destructive` |
| `UniButtonSizing` | `.automatic`, `.fitted`, `.flexible` |
| `UniButtonStyle` | `.automatic`, `.plain`, `.borderless`, `.bordered`, `.borderedProminent`, `.glass`, `.glassProminent` |
| `UniControlSize` | `.mini`, `.small`, `.regular`, `.large`, `.extraLarge` |
| `UniButtonBorderShape` | `.automatic`, `.roundedRectangle`, `.capsule`, `.circle`, `.roundedRectangleRadius(CGFloat)` |
| `UniHierarchicalVariant` | `.primary`, `.secondary`, `.tertiary`, `.quaternary`, `.quinary` |

### Material & Effect

| Enum | Cases |
|:---|:---|
| `UniMaterialType` | `.ultraThin`, `.thin`, `.regular`, `.thick`, `.ultraThick` |
| `UniMaterialStyle` | `.ultraThin`, `.thin`, `.regular`, `.thick`, `.ultraThick` |
| `UniGlassButtonVariant` | `.regular`, `.prominent` |
| `UniColorHierarchy` | `.primary` → `.quinary` |

### Layout & Container

| Enum | Cases |
|:---|:---|
| `UniViewThatFitsAxes` | `.horizontal`, `.vertical`, `.all` |
| `UniContainerBackgroundPlacement` | `.navigation`, `.navigationSplitView` |
| `UniScrollEdgeEffectStyle` | `.hard` |

### Component Styles

| Enum | Cases |
|:---|:---|
| `UniProgressViewStyle` | `.automatic`, `.linear`, `.circular` |
| `UniMenuOrder` | `.automatic`, `.fixed`, `.priority` |
| `UniControlGroupStyle` | `.automatic`, `.navigation`, `.menu`, `.compactMenu`, `.palette` |
| `UniDatePickerStyle` | `.automatic`, `.wheel`, `.graphical`, `.field`, `.stepperField` |
| `UniPickerStyle` | `.automatic`, `.menu`, `.inline`, `.navigationLink`, `.palette`, `.segmented`, `.wheel`, `.radioGroup` |
| `UniGaugeStyle` | `.automatic`, `.linear`, `.linearCapacity`, `.circular`, `.accessoryLinear`, `.accessoryLinearCapacity`, `.accessoryCircular`, `.accessoryCircularCapacity` |
| `UniProductViewStyle` | `.automatic`, `.large`, `.regular`, `.compact` |

### List & Sheet

| Enum | Cases |
|:---|:---|
| `UniListStyleType` | `.automatic`, `.plain`, `.grouped`, `.insetGrouped`, `.sidebar`, `.inset`, `.elliptical`, `.carousel`, `.bordered` |
| `UniListSectionSpacing` | `.default`, `.compact`, `.custom(CGFloat)` |
| `UniBackgroundProminence` | `.standard`, `.increased` |
| `UniBadgeProminence` | `.standard`, `.increased` |
| `UniSheetSizing` | `.automatic`, `.fitted`, `.page` |
| `UniPresentationDetent` | `.medium`, `.large`, `.fraction(CGFloat)`, `.height(CGFloat)` |
| `UniPresentationBackgroundInteraction` | `.automatic`, `.enabled`, `.disabled`, `.enabledUpThrough(UniPresentationDetent)` |
| `UniPresentationContentInteraction` | `.automatic`, `.scrolls`, `.resizes` |

### Toolbar & TabView

| Enum | Cases |
|:---|:---|
| `UniToolbarTitlePlacement` | `.automatic`, `.title`, `.subtitle`, `.largeTitle`, `.largeSubtitle` |
| `UniToolbarSpacerSizing` | `.fixed`, `.flexible` |
| `UniToolbarDefaultItemKind` | `.sidebarToggle`, `.title`, `.search` |
| `UniTabViewStyle` | `.automatic`, `.sidebarAdaptable`, `.tabBarOnly`, `.grouped`, `.page(indexDisplayMode:)`, `.verticalPage` |
| `UniPageTabIndexDisplayMode` | `.automatic`, `.always`, `.never` |
| `UniTabBarMinimizeBehavior` | `.automatic`, `.never`, `.onScrollDown`, `.onScrollUp` |
| `UniAdaptableTabBarPlacement` | `.automatic`, `.sidebar`, `.tabBar` |
| `UniBottomAccessoryPlacement` | `.inline`, `.expanded`, `.none` |
| `UniTabCustomizationPlacement` | `.automatic`, `.tabBar`, `.sidebar` |
| `UniTabCustomizationBehavior` | `.automatic`, `.reorderable`, `.disabled` |
| `UniTabRole` | `.automatic`, `.search` |
| `UniSymbolEffect` | `.bounce`, `.pulse`, `.variableColor`, `.breathe`, `.rotate`, `.wiggle` |
| `UniScrollTargetBehavior` | `.paging`, `.viewAligned` |

---

## 3. Components (Concrete Views)

Components are drop-in `View` structs. Import `ExploreSwiftUI` and use them directly.

### 3.1 Buttons

#### `UniButton<Label: View>`

A unified button with role, style, sizing, and border shape support.

```swift
// Title + action
UniButton("Delete", role: .destructive) { deleteItem() }
    .uniButtonStyle(.borderedProminent)
    .uniButtonBorderShape(.capsule)

// Custom label
UniButton(action: { doSomething() }) {
    Label("Share", systemImage: "square.and.arrow.up")
}
```

#### `UniRoleButton`

A button that uses semantic roles (cancel, close, confirm, destructive) with automatic localized titles.

```swift
UniRoleButton(role: .destructive) { deleteData() }
UniRoleButton(role: .close, title: "Dismiss") { dismiss() }
```

#### `UniRenameButton`, `UniPasteButton`, `UniEditButton`

System action buttons with automatic platform adaptation.

```swift
UniRenameButton { startRenaming() }
UniPasteButton { string in self.text = string }
UniEditButton()
```

#### `UniMenuActionButton<Label, Content>`

A button that presents a context menu with an optional primary action.

```swift
UniMenuActionButton {
    Button("Copy") { }
    Button("Paste") { }
} label: {
    Image(systemName: "ellipsis.circle")
} primaryAction: {
    defaultAction()
}
```

---

### 3.2 Text & Labels

#### `UniText`

Formatted text with number, measurement, date, and duration support.

```swift
UniText(1250.75, format: .currency(code: "USD"))
UniText(0.75, format: .percent)
UniText(42.5, format: .decimal(fractionLength: 2))
UniText(measurement, width: .abbreviated)  // "5 kg"
UniText(date: Date(), showTime: true)
UniText(seconds: 3660, pattern: .hourMinute) // "1:01"
```

#### `UniLabel<Title, Icon>`

Platform-agnostic label with icon and title rendering.

```swift
UniLabel("Profile", systemImage: "person.circle")
    .uniLabelStyle(.titleAndIcon)
```

#### `UniLabeledContent<Label, Content>`

A label+value pair using native `LabeledContent` (iOS 16+) or `HStack` fallback.

```swift
UniLabeledContent("Version", value: "2.4.0")
UniLabeledContent("Total", value: 1250, format: .currency(code: "USD"))
```

---

### 3.3 Navigation

#### `UniNavigationStack<Root>`

Bridges `NavigationStack` (iOS 16+) and `NavigationView` (iOS 15).

```swift
UniNavigationStack {
    List(items) { item in
        UniNavigationLink(value: item) { Text(item.name) }
    }
    .uniNavigationDestination(for: Item.self) { item in
        DetailView(item: item)
    }
}
```

#### `UniNavigationSplitView<Sidebar, Detail>`

Two-column split navigation.

```swift
UniNavigationSplitView {
    SidebarView()
} detail: {
    DetailView()
}
```

#### `UniNavigationSplitView3<Sidebar, Content, Detail>`

Three-column split navigation.

```swift
UniNavigationSplitView3 {
    SidebarView()
} content: {
    ContentView()
} detail: {
    DetailView()
}
```

---

### 3.4 Tab Views

#### `UniTabView<Selection>`

Polymorphic tab view using `TabContent` DSL (iOS 18+) or legacy `.tabItem` (iOS 15–17).

```swift
@State private var selectedTab = 0

UniTabView(selection: $selectedTab) {
    UniTab("Home", systemImage: "house", value: 0) {
        HomeView()
    }
    UniTab("Search", systemImage: "magnifyingglass", value: 1, role: .search) {
        SearchView()
    }
    UniTabSection("Account") {
        UniTab("Profile", systemImage: "person", value: 2) {
            ProfileView()
        }
    }
}
```

**Tab Descriptor Modifiers:**

```swift
UniTab("Inbox", systemImage: "tray", value: 3) { InboxView() }
    .uniTabBadge(5)
    .uniCustomizationID("tab.inbox")
    .uniCustomizationBehavior(.reorderable, for: [.sidebar])
```

---

### 3.5 Lists & Containers

#### `UniList<Content>`

A styled list with automatic platform adaptation.

```swift
UniList(style: .insetGrouped) {
    Section("Settings") {
        Text("General")
        Text("Privacy")
    }
}
```

#### `UniDisclosureGroup<Label, Content>`

Expandable/collapsible container. Native `DisclosureGroup` on iOS 14+/macOS 11+ (iOS/macOS/visionOS only), `VStack` fallback elsewhere.

```swift
UniDisclosureGroup("Details", isExpanded: $showDetails) {
    Text("More information...")
}

// Custom label
UniDisclosureGroup(isExpanded: $expanded) {
    detailContent()
} label: {
    Label("Options", systemImage: "gear")
}
```

#### `UniOutlineGroup<Data, ID, Parent, Leaf>`

Hierarchical tree data. Native on iOS 14+/macOS 11+ (iOS/macOS/visionOS only), flat `ForEach` fallback.

```swift
UniOutlineGroup(fileSystem, children: \.children) { item in
    Label(item.name, systemImage: item.isDirectory ? "folder" : "doc")
}
```

#### `UniGroupBox<Label, Content>`

Styled group box container.

```swift
UniGroupBox {
    Text("Content")
} label: {
    Text("Section Title")
}
```

#### `UniControlGroup<Content, Label>`

Groups related controls with a unified appearance.

```swift
UniControlGroup("Edit") {
    Button("Copy", systemImage: "doc.on.doc") { }
    Button("Paste", systemImage: "doc.on.clipboard") { }
}
```

---

### 3.6 Images & Media

#### `UniAsyncImage<Content>`

Asynchronous image loading with `URLRequest` + custom `URLSession` support.

```swift
// Simple
UniAsyncImage(url: imageURL) { phase in
    if let image = phase.image {
        image.resizable().aspectRatio(contentMode: .fit)
    } else if phase.error != nil {
        Color.red
    } else {
        ProgressView()
    }
}

// With URLRequest (iOS 27+ native, custom loader fallback)
UniAsyncImage(request: URLRequest(url: url)) { phase in ... }

// With placeholder shorthand
UniAsyncImage(url: imageURL) { image in
    image.resizable()
} placeholder: {
    ProgressView()
}
```

---

### 3.7 Forms & Inputs

#### `UniPicker<SelectionValue, Content, Label>`

Platform-adaptive picker with all SwiftUI picker styles.

```swift
UniPicker("Color", selection: $color) {
    Text("Red").tag(Color.red)
    Text("Blue").tag(Color.blue)
}
.uniPickerStyle(.segmented)
```

#### `UniDatePicker<Label>`

Date picker with style and tint support.

```swift
UniDatePicker("Start Date", selection: $date, displayedComponents: [.date])
    .uniDatePickerStyle(.graphical)
```

#### `UniMultiDatePicker<Label>`

Multi-date selection (iOS 16+).

```swift
UniMultiDatePicker("Dates", selection: $dates) {
    Text("Select dates")
}
```

#### `UniSlider<Label, ValueLabel, Ticks>`

Slider with tick marks and iOS 27+ native tick support.

```swift
UniSlider(value: $volume, in: 0...100) {
    Text("Volume")
} minimumValueLabel: { Text("0") }
  maximumValueLabel: { Text("100") }
```

#### `UniTickedSlider` / `UniTickedSliderLabeled`

Pre-built sliders with visual tick marks.

---

### 3.8 Progress & Gauges

#### `UniProgressView<Label, CurrentValueLabel>`

Indeterminate, value-based, or timer-based progress.

```swift
UniProgressView("Loading...", value: 0.45)
    .uniProgressViewStyle(.linear)

UniProgressView(style: .circular)
```

#### `UniGauge<Label, CurrentValueLabel, MinimumValueLabel, MaximumValueLabel>`

Gauge display with 8 visual styles.

```swift
UniGauge(value: 0.75, style: .accessoryCircular) {
    Text("Battery")
} currentValueLabel: {
    Text("75%")
}
```

---

### 3.9 Alerts & Dialogs

Use the bridge modifiers (see [Bridges § Alerts](#41-alerts--dialogs)).

---

### 3.10 Sharing

#### `UniShareLink<Label>`

Share sheets for URLs and strings.

```swift
UniShareLink(item: URL(string: "https://apple.com")!) {
    Label("Share", systemImage: "square.and.arrow.up")
}

UniShareLink("Share Article", item: articleURL)
```

#### `UniSharePreview`

```swift
UniSharePreview("My Photo", image: Image("preview"))
```

---

### 3.11 Links

#### `UniLink<Label>`

Standard hyperlinks.

```swift
UniLink("Apple", destination: URL(string: "https://apple.com")!)
```

#### `UniHelpLink<Label>`

A help button.

```swift
UniHelpLink { showHelp() }
```

#### `UniTextFieldLink<Label>`

A text field trigger link.

```swift
UniTextFieldLink("Enter name", prompt: Text("Name")) { name in
    handleSubmit(name)
}
```

---

### 3.12 Materials & Effects

#### `UniMaterial`

A standalone material background view.

```swift
UniMaterial(.thin)
```

#### `UniGlassEffectContainer<Content>`

Glass-effect container (iOS 26+ native, material fallback).

```swift
UniGlassEffectContainer {
    Text("Frosted content")
}
```

#### `UniGlassContainer<Content>`

```swift
UniGlassContainer {
    HStack { ... }
}
```

---

### 3.13 Shapes

#### `UniContainerRelativeShape`

Bridges `ContainerRelativeShape` (iOS 14+) with `RoundedRectangle` fallback.

```swift
content.clipShape(UniContainerRelativeShape())
```

#### `UniConcentricRectangle`

A concentric rectangle shape (iOS 26+ `ConcentricRectangle`, `RoundedRectangle` fallback).

```swift
UniConcentricRectangle(fallbackCornerRadius: 20, isUniform: true)
```

---

### 3.14 Colors

#### `UniColor` (Static Properties)

Cross-platform system colors bridging UIKit/AppKit.

| Property | Description |
|:---|:---|
| `UniColor.separator` | Thin border/divider color |
| `UniColor.opaqueSeparator` | Opaque divider |
| `UniColor.systemBackground` | Primary background |
| `UniColor.secondarySystemBackground` | Secondary background |
| `UniColor.tertiarySystemBackground` | Tertiary background |
| `UniColor.systemGroupedBackground` | Grouped list background |
| `UniColor.secondarySystemGroupedBackground` | Secondary grouped |
| `UniColor.tertiarySystemGroupedBackground` | Tertiary grouped |
| `UniColor.placeholderText` | Placeholder text color |
| `UniColor.systemFill` | Primary fill |
| `UniColor.secondarySystemFill` | Secondary fill |
| `UniColor.tertiarySystemFill` | Tertiary fill |
| `UniColor.quaternarySystemFill` | Quaternary fill |
| `UniColor.label` | Primary label |
| `UniColor.secondaryLabel` | Secondary label |
| `UniColor.tertiaryLabel` | Tertiary label |
| `UniColor.quaternaryLabel` | Quaternary label |
| `UniColor.mint` | Mint (polyfilled on iOS 14) |
| `UniColor.teal` | Teal (polyfilled) |
| `UniColor.cyan` | Cyan (polyfilled) |
| `UniColor.indigo` | Indigo (polyfilled) |
| `UniColor.brown` | Brown (polyfilled) |

---

### 3.15 Scroll Views

#### `UniScrollView<Content>`

Scroll view wrapper.

```swift
UniScrollView(.horizontal) {
    LazyHStack { ForEach(0..<100) { i in CardView(i) } }
}
```

#### `UniViewThatFits<Content>`

Layout that picks the first fitting child (iOS 16+, scrollable fallback).

```swift
UniViewThatFits(axes: .horizontal) {
    wideLayout
    compactLayout
}
```

---

### 3.16 Miscellaneous Components

#### `UniContentUnavailableView<Label, Description, Actions>`

Empty-state placeholder.

```swift
UniContentUnavailableView("No Results", systemImage: "magnifyingglass") {
    Button("Try Again") { reload() }
}

UniContentUnavailableView.search
UniContentUnavailableView.search(text: "query")
```

#### `UniDivider`

Customizable divider (see bridge modifiers).

#### `UniMenu<Content, Label>`

Menu with primary action support.

```swift
UniMenu("Options") {
    Button("Edit") { }
    Button("Delete", role: .destructive) { }
}
```

#### `UniProductView<Icon, PlaceholderIcon>`

StoreKit product view bridge (iOS 17+).

#### `UniLegacyCardModifier`

A legacy card-style modifier with rounded corners and shadow.

```swift
myView.uniLegacyCard(cornerRadius: 20)
```

---

## 4. Bridges (View Modifiers & Extensions)

Bridges are `extension View` modifiers. They are applied with `.uniXxx(...)` syntax.

### 4.1 Alerts & Dialogs

**File**: `Bridges/UniAlerts.swift`

```swift
// Standard alert
.uniAlert("Title", isPresented: $show) {
    Button("OK") { }
} message: {
    Text("Message body")
}

// Error-based alert
.uniAlert(error: $error) { Button("OK") { } }

// Item-based alert
.uniAlert("Edit", item: $selectedItem) { item in
    Button("Delete") { delete(item) }
}

// Confirmation dialog
.uniConfirmationDialog("Choose", isPresented: $show) {
    Button("Option A") { }
    Button("Option B") { }
}
```

All overloads:

| Modifier | Parameters |
|:---|:---|
| `uniAlert(_:isPresented:actions:message:)` | `LocalizedStringKey` title |
| `uniAlert(_:isPresented:actions:)` | Title only, no message |
| `uniAlert(_:isPresented:actions:message:)` | `StringProtocol` title |
| `uniAlert(error:actions:)` | `Binding<E?>` where E: LocalizedError |
| `uniAlert(error:actions:message:)` | Error with message |
| `uniAlert(_:item:actions:)` | Item-based |
| `uniAlert(_:item:actions:message:)` | Item-based with message |
| `uniConfirmationDialog(...)` | Same pattern as `uniAlert` |

---

### 4.2 Button Styling

**File**: `Bridges/UniButtons.swift`

| Modifier | Type | Description |
|:---|:---|:---|
| `.uniButtonSizing(_ sizing:)` | `UniButtonSizing` | Controls sizing behavior |
| `.uniButtonStyle(_ style:)` | `UniButtonStyle` | Visual style (includes glass polyfills) |
| `.uniButtonTint(_ tint:)` | `Color?` | Tint color |
| `.uniButtonBorderShape(_ shape:)` | `UniButtonBorderShape` | Border shape |

---

### 4.3 Text Modifiers

**File**: `Bridges/UniTexts.swift`

**On `Text`:**

| Modifier | Description |
|:---|:---|
| `.uniTracking(_ amount:)` | Letter spacing (tracking on iOS 16+, kerning fallback) |
| `.uniKerning(_ amount:)` | Kerning |
| `.uniItalic(_ active:)` | Italic toggle |
| `.uniBold(_ active:)` | Bold toggle |

**On `View`:**

| Modifier | Description |
|:---|:---|
| `.uniTracking(_ amount:)` | Tracking via environment |
| `.uniKerning(_ amount:)` | Kerning via environment |
| `.uniLineSpacing(_ amount:)` | Line spacing |
| `.uniItalic(_ active:)` | Italic toggle |
| `.uniBold(_ active:)` | Bold toggle |
| `.uniSemi(_ active:)` | Semibold weight |

---

### 4.4 Colors & Foreground

**File**: `Bridges/UniColors.swift`

```swift
.uniForegroundStyle(
    _ color: Color,
    hierarchy: UniColorHierarchy = .primary,
    gradient: Bool = false,
    opacity: Double = 1.0
)
```

---

### 4.5 Materials & Glass

**File**: `Bridges/UniMaterials.swift`

| Modifier | Description |
|:---|:---|
| `.uniBackgroundMaterial(_ type:)` | Background material layer |
| `.uniForegroundMaterial(_ type:)` | Foreground material (vibrancy) |

**File**: `Bridges/UniGlass.swift`

| Modifier | Description |
|:---|:---|
| `.uniGlass(in:isEnabled:)` | Glass effect on a shape |
| `.uniGlassButton(variant:isEnabled:)` | Glass button effect |
| `.uniBackgroundExtension(isEnabled:)` | Background extension effect |

**File**: `Bridges/UniViews.swift`

| Modifier | Description |
|:---|:---|
| `.uniControlSize(_ size:)` | Maps `UniControlSize` to native `ControlSize` |
| `.uniBackgroundExtensionEffect()` | Background extension effect |
| `.uniGlassEffect()` | Simple glass effect |
| `.uniGlassEffect(in: shape)` | Glass effect in a specific shape |
| `.uniMaterialBackground(style:cornerRadius:padding:)` | Material background with shape |
| `.uniForegroundStyle(color:hierarchy:gradient:opacity:)` | Hierarchical foreground color |

---

### 4.6 Lists

**File**: `Bridges/UniLists.swift`

| Modifier | Description |
|:---|:---|
| `.uniListStyle(_ style:)` | List visual style |
| `.uniListRowSeparator(_ visibility:)` | Row separator visibility |
| `.uniListSectionSeparator(_ visibility:)` | Section separator visibility |
| `.uniListRowSeparatorTint(_ color:)` | Row separator color |
| `.uniListSectionSeparatorTint(_ color:)` | Section separator color |
| `.uniListRowSpacing(_ spacing:)` | Row spacing |
| `.uniListSectionSpacing(_ spacing:)` | Section spacing |
| `.uniBackgroundProminence(_ prominence:)` | Row background prominence |
| `.uniListSectionMargins(_ edges:_ length:)` | Section margins |
| `.uniBadge(_ count:)` | Integer badge |
| `.uniBadge(_ string:)` | String badge |
| `.uniSwipeActionsContainer()` | Swipe actions container (iOS 27+) |
| `.uniSwipeActions(edge:allowsFullSwipe:content:)` | Swipe actions |
| `.uniSwipeActions(edge:allowsFullSwipe:content:onPresentation:)` | Swipe with presentation callback |
| `.uniRefreshable(action:)` | Pull-to-refresh |
| `.uniMoveDisabled(_ isDisabled:)` | Disable move |
| `.uniDeleteDisabled(_ isDisabled:)` | Disable delete |
| `.uniBadgeProminence(_ prominence:)` | Badge prominence |
| `.uniHeaderProminence(_ prominence:)` | Header prominence |
| `.uniListItemTint(_ tint:)` | List item tint |
| `.uniListRowBackground(_ view:)` | Row background view |
| `.uniListRowInsets(_ insets:)` | Row insets |
| `.uniSectionIndexLabel(_ label:)` | Section index label |
| `.uniListSectionIndexVisibility(_ visibility:)` | Section index visibility |
| `.uniDefaultMinListHeaderHeight(_ height:)` | Min header height |
| `.uniDefaultMinListRowHeight(_ height:)` | Min row height |

---

### 4.7 Navigation

**File**: `Bridges/UniNavigations.swift`

| Modifier | Description |
|:---|:---|
| `.uniNavigationTitle(_:subtitle:)` | Title + optional subtitle |
| `.uniNavigationDestination(for:destination:)` | Type-based navigation destination |
| `.uniNavigationDestination(item:destination:)` | Item-based navigation destination |
| `.uniContainerBackground(_:placement:)` | Container background with ShapeStyle |
| `.uniContainerBackground(placement:content:)` | Container background with View |
| `.uniScrollEdgeHardEffect(isEnabled:)` | Scroll edge effect |
| `.uniToolbarBackground(_:visibility:)` | Toolbar background style |
| `.uniToolbarBackground(_:for:)` | Toolbar background visibility |
| `.uniNavigationBarBackButtonHidden(_ hidden:)` | Hide back button |
| `.uniNavigationSubtitle(_ subtitle:)` | Navigation subtitle |
| `.uniToolbar(removing:)` | Remove default toolbar items |

---

### 4.8 Scroll Views

**File**: `Bridges/UniScrollViews.swift`

| Modifier | Description |
|:---|:---|
| `.uniScrollEdgeEffectStyle(_:edges:)` | Scroll edge effect (iOS 26+) |
| `.uniScrollTargetBehavior(_ behavior:)` | Paging or view-aligned scrolling (iOS 17+) |
| `.uniScrollPosition(id:anchor:)` | Programmatic scroll position (iOS 17+) |

---

### 4.9 Sheets & Presentations

**File**: `Bridges/UniSheets.swift`

| Modifier | Description |
|:---|:---|
| `.uniPresentationSizing(_ sizing:)` | Sheet sizing (iOS 18+) |
| `.uniPresentationDetents(_ detents:)` | Presentation detent set |
| `.uniPresentationDetents(_:selection:)` | Detents with selection binding |
| `.uniPresentationCornerRadius(_ radius:)` | Corner radius |
| `.uniPresentationBackground(_ style:)` | Background style |
| `.uniPresentationBackgroundInteraction(_:)` | Background interaction |
| `.uniPresentationContentInteraction(_:)` | Content interaction |
| `.uniPresentationDragIndicator(_ visibility:)` | Drag indicator visibility |
| `.uniInteractiveDismissDisabled(_ isDisabled:)` | Disable interactive dismiss |

---

### 4.10 Tab Views

**File**: `Bridges/UniTabViews.swift`

| Modifier | Description |
|:---|:---|
| `.uniTabViewStyle(_ style:)` | Tab view visual style |
| `.uniTabViewSidebarHeader(content:)` | Sidebar header |
| `.uniTabViewSidebarFooter(content:)` | Sidebar footer |
| `.uniTabViewSidebarBottomBar(content:)` | Sidebar bottom bar |
| `.uniDefaultAdaptableTabBarPlacement(_:)` | Default tab bar placement |
| `.uniTabViewCustomization(_:)` | Tab customization binding |
| `.uniTabBarMinimizeBehavior(_:)` | Tab bar minimize behavior |
| `.uniTabViewBottomAccessory(placement:content:)` | Bottom accessory view |

---

### 4.11 Toolbars

**File**: `Bridges/UniToolbars.swift`

| Type / Modifier | Description |
|:---|:---|
| `ToolbarItemPlacement.uni(_:)` | Unified toolbar placement |
| `UniToolbarSpacer` | Toolbar spacer view |
| `UniToolbarItemSpacer` | Toolbar content spacer |
| `.uniSharedBackgroundVisibility(_:)` | Toolbar background visibility (on ToolbarContent) |
| `.uniMatchedTransitionSource(id:in:)` | Matched geometry transition (on ToolbarContent) |

---

### 4.12 Pickers

**File**: `Bridges/UniPickers.swift`

| Modifier | Description |
|:---|:---|
| `.uniPickerStyle(_ style:)` | Picker visual style |
| `.uniHorizontalRadioGroupLayout(isEnabled:)` | Horizontal radio group (macOS) |
| `.uniDefaultWheelPickerItemHeight(_ height:)` | Wheel picker item height |

---

### 4.13 Date Pickers

**File**: `Bridges/UniDatePickers.swift`

| Modifier | Description |
|:---|:---|
| `.uniDatePickerStyle(_ style:)` | Date picker style |
| `.uniDatePickerTint(_ color:)` | Date picker tint |

---

### 4.14 Progress Views

**File**: `Bridges/UniProgressViews.swift`

| Modifier | Description |
|:---|:---|
| `.uniProgressViewStyle(_ style:)` | Progress view style |
| `.uniProgressTint(_ color:)` | Progress tint color |

---

### 4.15 Gauges

**File**: `Bridges/UniGauges.swift`

| Modifier | Description |
|:---|:---|
| `.uniGaugeStyle(_ style:)` | Gauge visual style |
| `.uniGaugeTint(_ style:)` | Gauge tint (ShapeStyle) |

---

### 4.16 Sliders

**File**: `Bridges/UniSliders.swift`

| Modifier | Description |
|:---|:---|
| `.uniSliderTint(_ color:)` | Slider tint color |
| `.uniSliderTicks(content:)` | Slider tick marks (iOS 27+) |

---

### 4.17 Menus

**File**: `Bridges/UniMenus.swift`

| Modifier | Description |
|:---|:---|
| `.uniMenuOrder(_ order:)` | Menu item ordering |
| `.uniContextMenu(menuItems:preview:)` | Context menu with preview |

---

### 4.18 Control Groups

**File**: `Bridges/UniControlGroups.swift`

| Modifier | Description |
|:---|:---|
| `.uniControlGroupStyle(_ style:)` | Control group visual style (environment) |

---

### 4.19 Group Boxes

**File**: `Bridges/UniGroupBoxes.swift`

| Modifier | Description |
|:---|:---|
| `.uniGroupBoxBackgroundStyle(_ style:)` | Group box background (ShapeStyle) |

---

### 4.20 Symbols

**File**: `Bridges/UniSymbols.swift`

```swift
Image(systemName: "wifi")
    .uniSymbolEffect(.bounce, isActive: isBouncing)
```

Supports: `.bounce`, `.pulse`, `.variableColor`, `.breathe`, `.rotate`, `.wiggle`.
Native on iOS 17+/18+; spring/opacity animation fallbacks on older OS.

---

### 4.21 Async Images

**File**: `Bridges/UniAsyncImages.swift`

| Modifier | Description |
|:---|:---|
| `.uniAsyncImageURLSession(_ session:)` | Custom URLSession for AsyncImage (iOS 27+ native) |

**Environment:**

| Key | Description |
|:---|:---|
| `\.uniAsyncImageURLSession` | Read/write the async image URL session |

---

### 4.22 Product Views

**File**: `Bridges/UniProductViews.swift`

| Modifier | Description |
|:---|:---|
| `.uniProductViewStyle(_ style:)` | StoreKit product view style |

---

### 4.23 Dividers

**File**: `Bridges/UniDividers.swift`

| Modifier | Description |
|:---|:---|
| `.uniDividerColor(_ color:)` | Divider color |
| `.uniDividerThickness(_ thickness:axis:)` | Divider thickness |

---

### 4.24 Reorderings (iOS 27+)

**File**: `Bridges/UniReorderings.swift`

On `DynamicViewContent`:

| Modifier | Description |
|:---|:---|
| `.uniReorderable()` | Enables reordering |
| `.uniReorderable(collectionID:)` | Reordering with collection ID |

On `View`:

| Modifier | Description |
|:---|:---|
| `.uniReorderContainer(for:isEnabled:move:)` | Reorder container for Identifiable items |
| `.uniReorderContainer(for:in:isEnabled:move:)` | With collection ID type |
| `.uniReorderContainer(for:itemID:isEnabled:move:)` | With custom item ID keypath |
| `.uniReorderContainer(for:itemID:in:isEnabled:move:)` | Full: custom item ID + collection ID |

---

## 5. Usage Patterns for AI Agents

### Pattern 1: Import & Use Components

```swift
import ExploreSwiftUI

struct MyView: View {
    var body: some View {
        UniNavigationStack {
            UniList(style: .insetGrouped) {
                UniLabeledContent("Name", value: "John")
                UniButton("Action") { doSomething() }
                    .uniButtonStyle(.borderedProminent)
            }
            .uniNavigationTitle("Settings")
        }
    }
}
```

### Pattern 2: Conditional Platform Logic

```swift
if UniPlatformVersion.isAvailable(iOS: 17) {
    // Use iOS 17+ specific layout
}

myView.if(UniPlatformVersion.supportsAdvancedSheetPresentation) {
    $0.uniPresentationDetents([.medium, .large])
}
```

### Pattern 3: Naming Convention

> **Rule**: Always use the `uni` prefix. Never use native SwiftUI modifiers directly when a `uni` equivalent exists, as the `uni` version handles backward compatibility automatically.

| ❌ Don't | ✅ Do |
|:---|:---|
| `.buttonStyle(.bordered)` | `.uniButtonStyle(.bordered)` |
| `.listStyle(.insetGrouped)` | `.uniListStyle(.insetGrouped)` |
| `.alert(...)` | `.uniAlert(...)` |
| `NavigationStack { }` | `UniNavigationStack { }` |
| `AsyncImage(url:)` | `UniAsyncImage(url:)` |
| `DisclosureGroup { }` | `UniDisclosureGroup { }` |
| `ContentUnavailableView(...)` | `UniContentUnavailableView(...)` |

### Pattern 4: Style + Modifier Composition

Styles are applied via bridge modifiers, not through initializer parameters:

```swift
UniButton("Save") { save() }
    .uniButtonStyle(.glassProminent)   // Visual style
    .uniButtonSizing(.flexible)         // Sizing behavior
    .uniButtonBorderShape(.capsule)     // Border shape
    .uniButtonTint(.blue)               // Tint color
```

### Pattern 5: Complete Tab View

```swift
@State private var selection: TabID = .home

UniTabView(selection: $selection) {
    UniTab("Home", systemImage: "house", value: .home) { HomeView() }
    UniTab("Search", systemImage: "magnifyingglass", value: .search, role: .search) { SearchView() }
    UniTabSection("More") {
        UniTab("Profile", systemImage: "person", value: .profile) { ProfileView() }
        UniTab("Settings", systemImage: "gear", value: .settings) { SettingsView() }
    }
}
.uniTabViewStyle(.sidebarAdaptable)
.uniTabBarMinimizeBehavior(.onScrollDown)
```

---

> **Last Updated**: 2026-07-03  
> **Source**: Auto-generated from `Sources/ExploreSwiftUI/` source tree analysis.
