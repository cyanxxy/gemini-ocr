# Contributing to Our Project

We're thrilled you're interested in contributing! This guide will help you get started. We welcome contributions of all kinds, from bug reports and feature suggestions to code contributions.

## How to Contribute

### Reporting Bugs

If you encounter a bug, please help us by submitting a bug report. A good bug report includes:

- A clear and descriptive title.
- Steps to reproduce the bug.
- What you expected to happen.
- What actually happened (including any error messages).
- Your environment details (e.g., browser version, operating system).

Please check existing issues to see if someone has already reported the bug before creating a new one.

### Suggesting Enhancements

We're always looking for ways to improve the project! If you have an idea for a new feature or an enhancement to an existing one, please open an issue to discuss it. Provide:

- A clear and descriptive title.
- A detailed description of the proposed enhancement.
- Any potential benefits or use cases.

### Your First Code Contribution

New to open source or this project? Here are some tips:

- Look for issues tagged "good first issue" or "help wanted." These are typically more straightforward and a great way to get familiar with the codebase.
- Don't hesitate to ask questions if you're unsure about something.
- Start small. A small, focused contribution is easier to review and merge.

### Pull Requests

When you're ready to contribute code, please follow this process:

1.  **Fork the repository:** Create your own copy of the project on GitHub.
2.  **Create a branch:** Make a new branch in your fork for your changes (e.g., `git checkout -b feature/your-feature-name` or `bugfix/issue-description`).
3.  **Make your changes:** Write your code and add any necessary tests.
4.  **Commit your changes:** Use clear and concise commit messages. We recommend following the [Conventional Commits](https://www.conventionalcommits.org/) specification. For example: `feat: Add user authentication` or `fix: Resolve issue with form submission`.
5.  **Push your changes:** Push your branch to your fork on GitHub.
6.  **Open a Pull Request (PR):** Submit a PR from your branch to our main repository.
    -   Use a clear and descriptive PR title.
    -   In the PR description, explain the changes you've made and link to any relevant issues (e.g., "Closes #123").

## Getting Started / Setting Up Your Development Environment

To get the project running locally:

1.  **Fork the repository:** As mentioned above, create your own fork.
2.  **Clone the fork:** `git clone https://github.com/YOUR_USERNAME/PROJECT_NAME.git` (replace `YOUR_USERNAME` and `PROJECT_NAME`).
3.  **Navigate to the project directory:** `cd PROJECT_NAME`
4.  **Install dependencies:** Run `npm install` to install all the necessary packages.
5.  **Run the development server:** Execute `npm run dev` to start the application locally.

## Coding Standards

We use ESLint to maintain code quality and consistency.

-   Before committing your code, please run `npm run lint` to check for and fix any linting errors.
-   While ESLint covers many style aspects, please also strive for:
    -   **Clear variable names:** Use descriptive names that indicate the purpose of variables and functions.
    -   **Concise comments:** Add comments to explain complex logic or non-obvious parts of your code. Avoid over-commenting simple code.

## Testing

We believe in the importance of testing to ensure the reliability of our codebase.

-   New features should ideally be accompanied by unit tests and/or integration tests.
-   Run `npm run test` to execute the test suite. Make sure all tests pass before submitting a PR.
-   You can check the current test coverage by running `npm run test:coverage`. Aim to maintain or improve coverage with your contributions.

## Pull Request Process

To ensure a smooth and effective review process, please follow these guidelines when submitting a Pull Request:

1.  **Clean Build:** Ensure any install or build dependencies are removed before the end of the layer when doing a build. This helps keep our production artifacts lean.
2.  **Documentation Updates:** Update the `README.md` with details of any changes to the interface. This includes new environment variables, exposed ports, useful file locations, and container parameters.
3.  **Version Bumping:** Increase the version numbers in any example files and the `README.md` to the new version that this Pull Request would represent. We use [SemVer](https://semver.org/) for versioning (e.g., `MAJOR.MINOR.PATCH`).
4.  **Review and Merge:** You may merge the Pull Request once you have the sign-off of two other developers. If you do not have permission to merge, you may request the second reviewer to merge it for you.

## Forking This Project

This project is designed to be fork-friendly. Here's what you need to know:

### CI Pipeline for Forks

The CI pipeline works automatically for forks with some differences:

- **Quality checks**: TypeScript, linting, and tests run normally
- **Security audit**: npm audit runs on all PRs
- **Build verification**: Build step ensures your changes compile
- **Codecov**: Skipped for forks (requires token setup)

### Setting Up Codecov (Optional)

If you want coverage reports on your fork:

1. Sign up at [codecov.io](https://codecov.io) with your GitHub account
2. Add your fork to Codecov
3. Add `CODECOV_TOKEN` to your repository secrets

### Deployment Options

#### Vercel (Recommended)

The easiest way to deploy your fork:

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Import Project" and select your fork
3. Vercel auto-detects the Vite configuration
4. Deploy! You'll get automatic preview deploys on PRs

#### Netlify (Alternative)

If you prefer Netlify:

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" > "Import an existing project"
3. Select your fork - the `netlify.toml` config is already included
4. Deploy!

### Running CI Locally

Before pushing, you can run the full CI suite locally:

```bash
# Install dependencies
npm ci

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Run tests with coverage
npm run test:coverage

# Build
npm run build
```

### Release Process

Releases are automated via GitHub Actions when you push a version tag:

```bash
# Create a new version tag
git tag v1.0.0
git push origin v1.0.0
```

This triggers the release workflow which builds and creates a GitHub release with auto-generated release notes.

Thank you for contributing! Your efforts help make this project better for everyone.
