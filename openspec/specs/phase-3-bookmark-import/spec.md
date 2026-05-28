## Purpose
Define manual browser bookmark import from bookmarks.html, including raw tree preservation, normalized bookmark deduplication, browsing views, and Promote to Service.

## Requirements

### Requirement: Browser bookmark import data model
Dockmark SHALL store imported browser bookmarks in both raw tree form and normalized bookmark form.

#### Scenario: Bookmark schema is migrated
- **WHEN** Phase 3 migrations are applied
- **THEN** D1 SHALL contain browser_bookmark_nodes, bookmarks, and bookmark_sources tables
- **AND** raw tree records SHALL preserve folder hierarchy, browser node IDs when available, titles, URLs, positions, and folder paths
- **AND** normalized bookmark records SHALL deduplicate by normalized URL

### Requirement: bookmarks.html import
Dockmark SHALL import browser bookmarks from a standard `bookmarks.html` file.

#### Scenario: User uploads bookmarks.html
- **WHEN** the import file is valid
- **THEN** Dockmark SHALL parse folders and links into raw bookmark nodes
- **AND** it SHALL create or update normalized bookmarks
- **AND** it SHALL record source metadata for each bookmark

#### Scenario: User uploads unsupported content
- **WHEN** the uploaded file is not a supported bookmarks export
- **THEN** Dockmark SHALL reject the file with a clear validation error
- **AND** existing bookmark data SHALL remain unchanged

### Requirement: URL normalization
Dockmark SHALL normalize bookmark URLs before deduplication.

#### Scenario: Bookmark URL is normalized
- **WHEN** a bookmark URL includes uppercase host, default ports, trailing slash, tracking parameters, or unordered query parameters
- **THEN** Dockmark SHALL normalize protocol and host case, remove default ports, remove common tracking parameters, normalize trailing slash behavior, and sort query parameters

#### Scenario: URL cannot be normalized safely
- **WHEN** a URL is missing, invalid, or uses an unsupported scheme
- **THEN** Dockmark SHALL either skip normalization for that record or reject it according to documented validation behavior

### Requirement: Bookmark browsing UI
Dockmark SHALL provide views for imported bookmarks without mixing them automatically into the service dashboard.

#### Scenario: User opens bookmark list
- **WHEN** the user visits the bookmarks page
- **THEN** they SHALL see imported bookmarks with title, URL, source folder path, and source metadata
- **AND** they SHALL be able to search by title, URL, folder path, and domain

#### Scenario: User opens bookmark tree
- **WHEN** the user visits the bookmark tree view
- **THEN** Dockmark SHALL display folders and bookmarks in their imported hierarchy

### Requirement: Promote bookmark to service
Dockmark SHALL allow a user to manually promote a normalized bookmark into a service navigation item.

#### Scenario: User promotes a bookmark
- **WHEN** the user selects Promote to Service for a bookmark
- **THEN** Dockmark SHALL prefill a service form from the bookmark title and URL
- **AND** the user SHALL choose or create a category before the item appears in home navigation
- **AND** the created service SHALL reference the source bookmark

### Requirement: Phase 3 excludes automatic browser sync
Phase 3 SHALL NOT require a browser extension, pairing code, sync token, or incremental browser event handling.

#### Scenario: No extension exists
- **WHEN** Phase 3 is deployed
- **THEN** users SHALL still be able to import browser bookmarks manually through `bookmarks.html`
