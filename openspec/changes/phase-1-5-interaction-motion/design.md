# Design

## Approach
Use Vue built-in `<Transition>` and `<TransitionGroup>` with shared CSS transition names defined in `apps/web/src/assets/main.css`.

The implementation SHALL prefer shared CSS motion classes over page-local animation definitions. Reusable wrapper components MAY be introduced only where they remove repeated template structure or improve maintainability.

## Motion Tokens
Define shared motion tokens for duration and easing:
- Fast duration for small control feedback.
- Base duration for route, feedback, and list item transitions.
- Slow duration for modal and panel entry when needed.
- Standard easing values for subtle administrative UI motion.

## Transition Families
- `dm-fade`: opacity-only changes.
- `dm-panel`: dialog and editor panel entry and exit.
- `dm-list`: list/card insertion, removal, and move transitions.
- `dm-feedback`: success, error, and info feedback appearance.
- `dm-collapse`: mobile filter disclosure.

## Accessibility
All non-essential motion SHALL be disabled or reduced under `prefers-reduced-motion: reduce`.

Reduced motion mode SHALL preserve visibility changes and layout correctness without transform-heavy movement.

## Implementation Notes
- Do not introduce GSAP, Motion for Vue, or another animation dependency for this phase.
- Prefer opacity and transform animations over layout-heavy properties.
- Keep table row animation conservative so desktop management tables remain stable and scannable.
- Preserve existing focus handling, body scroll locking, and route-driven editor behavior.
