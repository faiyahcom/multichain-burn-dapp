# Branches
- main: for development
- beta: for beta testing (with mapped domain)
- prod: for production (with mapped domain)
- main-admin: for admin development
- beta-admin: for admin beta testing (with mapped domain)
- prod-admin: for admin production (with mapped domain)

## Middle branches (for verified PRs)
- main-to-beta: for verified PRs from main to beta
- main-admin-to-beta-admin: for verified PRs from main-admin to beta-admin

## Workflow
- Checkout from middle branch (this ensures that all PRs code is verified)
- Name the checkout branch with the task code (e.g. fix/mb-123)
- For dev testing and proofs, PR the new branch to the development branch (e.g. main, main-admin)
- If the task is verified, merge the PR to the middle branch (e.g. main-to-beta, main-admin-to-beta-admin)
- When requested, create a PR from the middle branch to the beta branch (e.g. beta, beta-admin)

## The PR flow:
```mermaid
graph LR;
  checkout["&lt;checkout branch&gt;"] -->|dev testing and proof| main;
  checkout["&lt;checkout branch&gt;"] -->|verified| main-to-beta;
  main-to-beta -->|requested| beta;
  checkout["&lt;checkout branch&gt;"] -->|dev testing and proof| main-admin;
  checkout["&lt;checkout branch&gt;"] -->|verified| main-admin-to-beta-admin;
  checkout-admin["&lt;admin checkout branch&gt;"] -->|dev testing and proof| main-admin;
  checkout-admin["&lt;admin checkout branch&gt;"] -->|verified| main-admin-to-beta-admin;
  main-admin-to-beta-admin -->|requested| beta-admin;
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
