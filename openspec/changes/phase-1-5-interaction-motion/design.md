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
- `dm-list`: dynamic row insertion, removal, and move transitions for controlled, non-filter-driven lists.
- `dm-feedback`: success, error, and info feedback appearance.
- `dm-collapse`: mobile filter disclosure.

## Accessibility
All non-essential motion SHALL be disabled or reduced under `prefers-reduced-motion: reduce`.

Reduced motion mode SHALL preserve visibility changes and layout correctness without transform-heavy movement.

## Implementation Notes
- Do not introduce GSAP, Motion for Vue, or another animation dependency for this phase.
- Prefer opacity and transform animations over layout-heavy properties.
- Keep search/filter-driven home and management lists on normal containers. Earlier `TransitionGroup` use in these views caused retained-item and leaving-item layout motion during filtering, so list motion is reserved for controlled dynamic rows such as service editor endpoints.
- Keep table rows stable so desktop management tables remain scannable.
- Preserve existing focus handling, body scroll locking, and route-driven editor behavior.
