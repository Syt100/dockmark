# Design

## Approach
Keep top-level route rendering structurally simple and reserve animation for local UI surfaces where geometry is controlled.

Top-level routes SHALL render directly through `RouterView` without a wrapping Vue `Transition`. The application SHALL avoid overlapping old and new top-level pages because page height, async loading state, and list density differ across routes and can make page-level crossfades appear to jump even when transform motion is removed.

Route-driven editor dialogs SHALL keep their parent management view mounted while the child route transitions in and out. This allows both open and close animation while preserving the existing route-based editor model.

Destructive confirmation dialogs SHALL animate the backdrop with `dm-fade` and the dialog panel with `dm-panel` independently. The backdrop SHALL not inherit scale/translate animation intended for the panel.

## Performance
- Do not animate top-level route geometry or opacity.
- Prefer `opacity` and `transform` only for local overlays and panels.
- Avoid layout animation on filtered management lists.
- Keep durations short enough that animation communicates state without delaying interaction.

## Accessibility
Existing focus management, Escape handling, body scroll locking, and `prefers-reduced-motion` behavior SHALL be preserved.
