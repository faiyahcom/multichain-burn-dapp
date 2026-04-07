# Branches
- main: for development, all logic and sc changes should be made here
- main-admin: for admin development
- CR/convert-design: for user development (since user version uses the new design)
- beta-admin: for admin beta (with mapped domain)
- staging/new-design: for user beta (with mapped domain)
- there are no production branches yet, they are expected to be called prod-user, prod-admin

## Workflow
- if there are any changes related to common, global Ui, logic, SC, please checkout from main branch and make PR to main branch
- any UI changes that are specific to user or admin, please checkout from the role-related branch and make PR to that branch
- all changes in main will be merge to main-admin and CR/convert-design
- all changes in main-admin will be merge to beta-admin
- all changes in CR/convert-design will be merge to staging/new-design
- beta/staging branches will be pushed to role-related production branches

## The PR flow:
```mermaid
graph LR;
  checkout["&lt;checkout branch&gt;"] -->|common, global Ui, logic, SC| main;
  checkout["&lt;checkout branch&gt;"] -->|user only UI| CR/convert-design;
  checkout["&lt;checkout branch&gt;"] -->|admin only UI| main-admin;
  main --> CR/convert-design;
  main --> main-admin;
  CR/convert-design --> staging/new-design;
  main-admin --> beta-admin;
```
Same for admin branches, with the exception that PRs directly from main to main-admin are allowed, no middle branch is needed.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
