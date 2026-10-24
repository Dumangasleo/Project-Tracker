/** Default Gitea Actions pipeline added to every repository created from Vortex Sync. */
export const DEFAULT_CI_WORKFLOW = `name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: |
          if [ -f yarn.lock ]; then corepack enable && yarn install --frozen-lockfile
          elif [ -f package-lock.json ]; then npm ci
          elif [ -f package.json ]; then npm install
          else echo "No package.json yet, nothing to install"; fi

      - name: Lint
        run: if [ -f package.json ]; then npm run lint --if-present; fi

      - name: Test
        run: if [ -f package.json ]; then npm run test --if-present; fi

      - name: Build
        run: if [ -f package.json ]; then npm run build --if-present; fi
`;
