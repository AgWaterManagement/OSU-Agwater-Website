# OSU-Agwater-Website
Oregon State University's AgWater website 

d:\Websites\AgWaterWebsite\
│
├── public\                # Static files (index.html, favicon, etc.)
├── src\
│   ├── assets\            # Images, fonts, etc.
│   ├── components\        # Reusable React components
│   ├── pages\             # Page-level components (route targets)
│   ├── layouts\           # Layout components (wrappers, navigation)
│   ├── services\          # API calls, business logic
│   ├── utils\             # Utility/helper functions
│   ├── hooks\             # Custom React hooks
│   ├── main.jsx           # Main app component
│   └── ...                # Other config, types, etc.
├── package.json
├── vite.config.js
└── 


## Best Practices for React Sites with Ant Design

*Component Organization:*

Keep components small, focused, and reusable.
Use folders to group related components and their styles.

*Ant Design Usage:*

Use antd components for consistency and rapid development.
Customize themes via ConfigProvider or less variables.

Import only needed antd components/styles to reduce bundle size.
State Management:

Use React hooks (useState, useEffect, etc.) for local state.
For global state, consider Context API, Redux, or Zustand.

Routing:

Use react-router for client-side routing.
Organize routes in a central location.

Styling:

Prefer CSS-in-JS (e.g., styled-components) or scoped CSS modules.
Override antd styles carefully to avoid specificity issues.

Code Quality:

Lint and format code with ESLint and Prettier.
Write unit and integration tests (e.g., with Jest, React Testing Library).

Performance:

Use React’s lazy loading (React.lazy, Suspense) for code splitting.
Memoize expensive computations and components (useMemo, React.memo).

Accessibility:

Ensure components are accessible (aria attributes, keyboard navigation).
Use antd’s accessibility features.

Deployment:

Optimize builds for production.
Use environment variables for configuration.