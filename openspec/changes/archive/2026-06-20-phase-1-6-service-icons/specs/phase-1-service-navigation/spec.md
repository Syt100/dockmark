## ADDED Requirements

### Requirement: Service icons support multiple display modes
Dockmark SHALL support service icon display modes for emoji/text, direct image URL, and primary-endpoint favicon while keeping service navigation usable when icon assets are missing or fail to load.

#### Scenario: Service icon is rendered in navigation
- **WHEN** a service appears on the home navigation view or service management view
- **THEN** Dockmark SHALL render the service icon in a fixed-size visual slot
- **AND** the service name and surrounding row/card layout SHALL remain stable regardless of icon mode

#### Scenario: Favicon mode is selected
- **WHEN** a service has `iconType` set to `favicon`
- **THEN** Dockmark SHALL derive the favicon candidate from the service primary endpoint origin
- **AND** Dockmark SHALL render a generated fallback if no primary endpoint origin can be derived or the favicon image fails to load

#### Scenario: Direct image URL mode is selected
- **WHEN** a service has `iconType` set to `url`
- **THEN** Dockmark SHALL render the icon from the stored image URL
- **AND** Dockmark SHALL render a generated fallback if the image fails to load

#### Scenario: Emoji mode is selected
- **WHEN** a service has `iconType` set to `emoji`
- **THEN** Dockmark SHALL render the stored emoji or short text icon when present
- **AND** Dockmark SHALL render a generated fallback when the stored icon is empty

### Requirement: Service icon editing preserves icon type
Dockmark SHALL allow service editors to choose the service icon display mode and SHALL persist the selected icon type through the existing service item API contract.

#### Scenario: Service icon is edited
- **WHEN** a user creates or edits a service
- **THEN** the editor SHALL provide controls for emoji/text, direct image URL, and primary-endpoint favicon modes
- **AND** the editor SHALL submit both `icon` and `iconType` according to the selected mode

#### Scenario: Service icon input is invalid
- **WHEN** a service create or update payload uses `iconType` set to `url` with a non-URL icon value
- **THEN** Dockmark SHALL reject the payload through shared validation before persistence

#### Scenario: Deferred icon modes are present
- **WHEN** a service has an unsupported or deferred icon mode such as R2 or simple-icons
- **THEN** Dockmark SHALL avoid broken visual output
- **AND** Dockmark SHALL keep later-phase R2 upload and branded icon registry behavior out of Phase 1.6
