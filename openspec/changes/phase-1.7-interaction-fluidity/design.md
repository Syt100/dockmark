# Design

## Approach
Refine the existing Vue built-in transition system rather than introducing a new animation dependency.

Top-level routes SHALL no longer use `mode="out-in"`. The old and new views MAY overlap briefly so navigation feedback begins immediately. Route motion SHALL use opacity and a very small translate distance to avoid perceived lag.

Route-driven editor dialogs SHALL keep their parent management view mounted while the child route transitions in and out. This allows both open and close animation while preserving the existing route-based editor model.

Destructive confirmation dialogs SHALL animate the backdrop with `dm-fade` and the dialog panel with `dm-panel` independently. The backdrop SHALL not inherit scale/translate animation intended for the panel.

## Performance
- Prefer `opacity` and `transform` animations only.
- Avoid layout animation on filtered management lists.
- Keep durations short enough that animation communicates state without delaying interaction.

## Accessibility
Existing focus management, Escape handling, body scroll locking, and `prefers-reduced-motion` behavior SHALL be preserved.
