# Design

## Approach
Keep top-level route rendering structurally simple and reserve animation for local UI surfaces where geometry is controlled.

Top-level routes SHALL render directly through `RouterView` without a wrapping Vue `Transition`. The application SHALL avoid overlapping old and new top-level pages because page height, async loading state, and list density differ across routes and can make page-level crossfades appear to jump even when transform motion is removed. Obsolete route-transition CSS SHALL be removed so the stylesheet does not imply that page-level motion remains supported.

Route-driven desktop editor dialogs SHALL keep their parent management view mounted while the child route transitions in and out. Closing actions SHALL first move the overlay and panel into their leave state and SHALL navigate back only after the panel leave transition completes. The same close path SHALL be used by the close button, Escape, backdrop dismissal, cancel actions, and successful saves. Mobile editor navigation remains direct because the editor is rendered as a normal page at mobile widths.

Destructive confirmation dialogs SHALL animate the backdrop with `dm-fade` and the dialog panel with `dm-panel` independently. The backdrop SHALL not inherit scale/translate animation intended for the panel.

## Loading and Refresh Feedback
Management pages SHALL distinguish initial loading from later refreshes. Initial loading SHALL use list-shaped skeleton content with a stable minimum height so the page does not briefly collapse to a single loading message. Once records have loaded, later refreshes SHALL keep the current records rendered and expose a compact refresh indicator instead of replacing the list.

Only the newest outstanding management-list load SHALL be allowed to update records, errors, and loading/refresh state. Older requests that resolve after a newer request SHALL be ignored so stale responses cannot overwrite newer data or prematurely clear progress indicators.

After a delete request succeeds, the deleted record SHALL be removed from local state immediately. A subsequent non-blocking refresh SHALL reconcile local state with server truth.

## Route Preloading
Primary lazy top-level route loaders SHALL be reusable functions. After the application mounts, Dockmark SHALL schedule those loaders for browser idle time so common first navigations are less likely to wait for a route chunk without competing unnecessarily with first-paint work. When `requestIdleCallback` is unavailable, a short delayed fallback SHALL be used. Preloading SHALL fetch code only and SHALL NOT issue management data requests.

## Control and List Feedback
Shared buttons and link-buttons SHALL provide subtle active-state scale feedback, while icon buttons MAY use a slightly smaller active scale. Reduced-motion users SHALL not receive the scale effect. Top navigation SHALL keep direct route rendering but SHALL respond immediately through short color transitions and active-state background feedback.

Management list additions/removals MAY use the existing short local enter/leave transition. Remaining records SHALL NOT receive FLIP/move position interpolation when list membership changes; they SHALL settle directly into their new positions to prioritize visual stability.

## Performance
- Do not animate top-level route geometry or opacity.
- Prefer `opacity` and `transform` only for local overlays, panels, controls, and the entering/leaving record itself.
- Keep management data visible during refreshes to avoid unnecessary layout reconstruction.
- Ignore stale management-list responses when a newer load is already in flight.
- Preload route code during browser idle time rather than immediately after mount or through additional API requests.
- Keep durations short enough that animation communicates state without delaying interaction.

## Accessibility
Existing focus management, Escape handling, body scroll locking, and `prefers-reduced-motion` behavior SHALL be preserved. Loading skeletons SHALL expose a concise status label without making decorative skeleton elements individually discoverable.
