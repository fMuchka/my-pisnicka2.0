# Project Diagrams (Mermaid)

Visual documentation for My Písnička 2.0 architecture and flows.

## Available Diagrams

- **Architecture**: [architecture.md](architecture.md) - System architecture with Vue, Firebase, ARK UI, PWA
- **Data Flow**: [data-flow.md](data-flow.md) - Session join flow, authentication flow, host/guest access
- **User Flows**: [user-flows.md](user-flows.md) - Host journey, guest journey, song interaction, route access
- **Folder Map**: [folder-map.md](folder-map.md) - Project structure and organization

## Quick Links

### Architecture Overview

See [architecture.md](architecture.md) for:

- Tech stack components
- Firebase integration
- Testing infrastructure
- PWA configuration

### Understanding Data Movement

See [data-flow.md](data-flow.md) for:

- Session PIN validation flow
- Authentication patterns (email/password, future anonymous)
- Host and guest access flows

### User Experience Flows

See [user-flows.md](user-flows.md) for:

- Host workflow (login → create session → manage songs)
- Guest workflow (join via PIN → view songs → vote)
- Song display and auto-scroll interaction
- Route protection and authentication checks

### Codebase Navigation

See [folder-map.md](folder-map.md) for:

- Source code organization (`src/`)
- Test structure (`tests/`)
- Configuration files
- Public assets and PWA manifests

## How to Use

These diagrams are written in Mermaid syntax and render automatically in:

- GitHub markdown viewer
- VS Code with Mermaid extensions
- Documentation sites that support Mermaid

To edit diagrams:

1. Open the relevant `.md` file
2. Modify the Mermaid code block
3. Preview changes in VS Code or commit to see on GitHub
