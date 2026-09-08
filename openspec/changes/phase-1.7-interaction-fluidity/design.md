# Design

## Approach
Refine the existing Vue built-in transition system rather than introducing a new animation dependency.

Top-level routes SHALL no longer use `mode="out-in"`. The old and new views MAY overlap briefly so navigation feedback begins immediately. Route transitions SHALL use an opacity-only crossfade at the top level so navigation feedback does not add perceived spatial movement.

The leaving route SHALL be positioned inside an unpadded relative viewport nested within the normal padded page shell. This keeps the leaving and entering routes in the same content-box geometry when the leave phase switches to `position: absolute`, avoiding the visible snap caused by resolving `inset: 0` against the padded shell.

Route-driven editor dialogs SHALL keep their parent management view mounted while the child route transitions in and out. This allows both open and close animation while preserving the existing route-based editor model.

Destructive confirmation dialogs SHALL animate the backdrop with `dm-fade` and the dialog panel with `dm-panel` independently. The backdrop SHALL not inherit scale/translate animation intended for the panel.

## Performance
- Prefer `opacity` and `transform` animations only; top-level route crossfades use opacity only.
- Avoid layout animation on filtered management lists.
- Keep durations short enough that animation communicates state without delaying interaction.

## Accessibility
Existing focus management, Escape handling, body scroll locking, and `prefers-reduced-motion` behavior SHALL be preserved.
