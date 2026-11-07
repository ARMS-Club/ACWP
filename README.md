# ARMS — Centennial College Student Project Club

The official website of ARMS, a student project club at Centennial College. It is a responsive, single-page site built with plain HTML, CSS and JavaScript. All visitor-facing content is in English.

## Contents

- [Features](#features)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Managing projects](#managing-projects)
- [Contact configuration](#contact-configuration)
- [Design system](#design-system)
- [Accessibility](#accessibility)
- [Content guidelines](#content-guidelines)
- [Deployment](#deployment)

## Features

### Interactive 3D project sphere

- A geodesic sphere with labelled project icons distributed across its surface. Icons on the far side stay hidden until rotation brings them into view.
- Visitors rotate the sphere by clicking and dragging, or with the arrow keys. Moving the cursor alone does not rotate it.
- Selecting an icon zooms toward it and opens the project brief in a panel beside the sphere (below it on mobile). The sphere stays interactive while the panel is open, and selecting another icon replaces the brief.
- **Back to overview** and **Reset view** return to the main introduction.
- Animated facets assemble, dissolve and re-form, with selected panels extruded in 3D. The mesh uses 1,280 triangles on desktop and 320 on smaller screens for performance.

### Site sections

- About us and the club's future plans.
- Six suggested project concepts with discipline filters and starter briefs.
- An interactive portfolio guide.
- Frequently asked questions.
- An introduction builder that helps visitors draft a message to the club.

### Motion and visual effects

- Staggered headline entrances, a scrolling discipline strip and subtle section transitions.
- A background sphere that emerges behind dark sections on scroll. The portfolio and join sections keep solid backgrounds for readability.
- Project briefs appear with a typing effect. Space is reserved in advance to prevent layout shifts, and a **Show full brief** control reveals the full text at once.
- Animations run only while visible and pause when the section scrolls out of view or the browser tab is hidden.

## Project structure

```
ACWP/
├── README.md
├── ARMS-preview.html        # Standalone preview of the site
└── dist/                    # Production site (serve this folder)
    ├── index.html
    ├── styles.css
    ├── components.css
    ├── motion.css
    ├── project-panel.css
    ├── universe.css
    ├── app.js
    ├── club-config.js       # Contact details and social links
    ├── projects.js          # Single source of project data
    ├── motion.js
    ├── project-panel.js
    ├── universe.js
    └── assets/
        ├── arms-logo.jpg
        └── club-hero.png
```

## Getting started

The site has no dependencies and requires no build step.

1. Clone the repository.
2. Open `dist/index.html` in a browser, or serve the `dist` folder with any local static server.

## Managing projects

All project data lives in `dist/projects.js`. Both the sphere and the project cards read from this file, so a single edit updates the entire site.

To add a project, append a new object to the list. Give it a unique `id` and include the same fields as the existing entries:

- Discipline and related disciplines
- Title and a short `networkTitle` (used as the sphere label)
- Description
- Workflow
- First step
- Tasks
- Portfolio output
- Contribution

The sphere displays up to six icons per page. **Previous** and **Next** controls appear automatically when more projects are added, and the discipline filters apply to both the sphere and the cards.

## Contact configuration

The club's email address (ARMSsme@outlook.com), Instagram and LinkedIn links are defined in `dist/club-config.js`.

The site does not send messages or store applications. Instead, it prepares an email draft that the visitor reviews and sends from their own email client.

## Design system

| Role          | Color      | Hex       |
| ------------- | ---------- | --------- |
| Accent        | Gold       | `#ECC47E` |
| Accent        | Bronze     | `#B0814A` |
| Background    | Black      | `#010203` |
| Surface       | Graphite   | `#1A1C1E` |
| Detail        | Steel      | `#37464D` |
| Detail        | Blue       | `#599CAE` |

Warm off-white and cool neutral text tones, along with a lighter gold hover state, maintain readable contrast against the dark palette.

The club logo (`dist/assets/arms-logo.jpg`) appears in the header, at the center of the sphere and in the footer. It retains its original colors, proportions and white background. Source: [ARMS LinkedIn page](https://ca.linkedin.com/in/arms-sme-698b15418).

## Accessibility

- Fully responsive layouts for mobile, tablet and desktop.
- All interactive controls, including the sphere and project panels, are keyboard accessible.
- Project briefs are available in full to screen readers immediately, regardless of the typing animation.
- When the visitor's device requests reduced motion, animations are minimized and briefs appear instantly.

## Content guidelines

- Projects listed on the site are **concepts to explore**, not completed club work.
- Activities, partnerships and competitions are **planned**, not confirmed events or agreements.

Please keep this distinction clear when editing site content.

## Deployment

Deploy the contents of the `dist` folder to any static web host. No server-side code or build process is required.
