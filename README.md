# ARMS — Centennial student project club

Responsive, single-page website for ARMS. All visitor-facing content is in English.

## Included

- An enlarged interactive 3D project sphere with a triangular geodesic mesh and labelled project icons spread across the whole shell. Rear-facing icons and their labels stay hidden until rotation brings them forward. Rotate by holding and dragging (or using arrow keys); moving the cursor alone does not rotate the sphere. Selecting an icon gently zooms toward it and writes its project brief into a panel beside the sphere. The sphere remains interactive while the brief is open, and choosing another icon replaces the text. On mobile the panel sits below the sphere. Back to overview and Reset view restore the main introduction.
- Animated facets that assemble, dissolve, and re-form. Some panels are extruded in 3D, with visible side walls rising from the shell. Desktop uses 1,280 triangles; smaller screens use 320 for lighter rendering.
- A subtle sphere that emerges behind dark sections as the visitor scrolls. The graphite portfolio and steel join sections preserve solid backgrounds for readability.
- The latest six-color palette supplied by the club: deep black backgrounds, graphite surfaces, steel-blue details, and bronze and gold accents across the sphere and interface.
- The original SME ARMS Club logo from its LinkedIn cover is stored locally as `dist/assets/arms-logo.jpg` and used in the header, sphere center and footer. Its original proportions and white background are preserved. Source: https://ca.linkedin.com/in/arms-sme-698b15418
- About us and the stated future plans; six suggested project concepts with filters and starter briefs; an interactive portfolio guide; FAQs; and a local introduction builder.
- Staggered headline entrances, a moving discipline strip, gentle section appearances and interaction effects.
- Mobile layouts, keyboard-accessible controls and project panels, and reduced-motion support. There is no manual pause control or saved pause condition. Animation runs while visible and stops when out of view or the page is hidden.

Project briefs include sequential typing with reserved text space to avoid layout shifts, a Show full brief control, complete text immediately available to screen readers, and instant text when the device requests reduced motion. Project cards open the same inline panel; no project modal or page-covering overlay remains.

## Project maintenance

Projects have one shared source in `dist/projects.js`. Add a project object to that list to include it in both the sphere and the cards. Keep its `id` unique and supply the same fields as the existing entries: discipline, related disciplines, title, short `networkTitle`, description, workflow, first step, tasks, portfolio output and contribution. The sphere uses up to six icons per page, displaying the front-facing ones as the visitor rotates it. Previous/Next controls appear automatically when more projects are added. The discipline filters update both views.

## Contact setup

The supplied email ARMSsme@outlook.com, Instagram and LinkedIn are configured in `dist/club-config.js`. The website prepares an email draft for the visitor to review and send; it does not send messages or store member applications itself.

## Content and design

Projects are concepts to explore, not completed club achievements. Activities, partnerships and competitions are plans rather than confirmed events or agreements. The previous generated engineering artwork is retained in the assets folder but is no longer displayed in the hero.

Palette taken from the latest supplied reference: gold #ECC47E, bronze #B0814A, primary black #010203, graphite #1A1C1E, steel #37464D and blue #599CAE. Warm off-white text, cool neutral text and a lighter gold hover tint support readable contrast. The official club logo keeps its original colors.

No dependencies or build are required. Serve `dist` using a static web host. Hosting identity is preserved in `.openai/hosting.json`; this delivery remains a local review version until publication succeeds.
