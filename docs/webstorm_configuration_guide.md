# WebStorm Configuration Guide for DojoPool

This guide explains how to use the configured WebStorm features for the DojoPool project.

## Table of Contents
1. [Run/Debug Configuration](#rundebug-configuration)
2. [Code Quality Tools](#code-quality-tools)
3. [Git Integration](#git-integration)
4. [Database Connection](#database-connection)

## Run/Debug Configuration

A run configuration has been set up to easily start the development server:

1. Look for the "Start DojoPool" configuration in the run configurations dropdown (top-right of WebStorm).
2. Click the green play button ▶️ to start the development server.
3. The server will start with the `npm run dev` command.

## Code Quality Tools

### ESLint

ESLint has been configured to automatically check your code for errors and style issues:

1. ESLint will highlight issues directly in the editor.
2. Issues will also appear in the "Problems" tool window.
3. Many issues can be fixed automatically by pressing Alt+Enter and selecting "Fix ESLint Problems".

### Prettier

Prettier has been configured to automatically format your code:

1. Code will be formatted automatically when you save a file.
2. You can also manually format code by right-clicking and selecting "Reformat Code" or by pressing Ctrl+Alt+L.

## Git Integration

WebStorm has a built-in Git client that is already configured for this project:

1. Access the Git tool window by clicking on "Git" at the bottom of the screen or by pressing Alt+9.
2. The Git tool window allows you to:
   - View changed files
   - Commit changes
   - Create and manage branches
   - View commit history
   - Resolve merge conflicts
   - Push and pull changes

### Common Git Operations

- **Commit Changes**: Select files in the Git tool window, right-click and select "Commit" or press Ctrl+K.
- **Push Changes**: Click the "Push" button in the Git tool window or press Ctrl+Shift+K.
- **Pull Changes**: Click the "Update Project" button in the Git tool window or press Ctrl+T.
- **Create Branch**: Right-click on a branch in the Git tool window and select "New Branch".
- **Switch Branch**: Double-click on a branch in the Git tool window.

## Database Connection

WebStorm has been configured to connect to the DojoPool PostgreSQL database:

1. Access the Database tool window by clicking on "Database" on the right side of the screen or by pressing Alt+1 and selecting "Database".
2. You'll see a connection named "DojoPool PostgreSQL".
3. Right-click on the connection and select "Properties" to verify or update the connection details.
4. When connecting for the first time, you'll be prompted to enter the database password.

### Using the Database Tool Window

- **Browse Tables**: Expand the database connection to see schemas and tables.
- **View Data**: Double-click on a table to view its data.
- **Run SQL Queries**: Click the "New SQL Console" button or right-click on the connection and select "New > Query Console".
- **Export Data**: Right-click on a table and select "Export" to export data in various formats.
- **Import Data**: Right-click on a schema and select "Import" to import data from files.

### Connection Details

The database connection is configured with the following details:

- **Host**: localhost
- **Port**: 5432
- **Database**: dojopool
- **Username**: dojopool

Note: For security reasons, the password is not stored in the configuration. You'll need to enter it when connecting.

## Troubleshooting

### Git Issues

- If Git operations are not working, ensure that Git is installed on your system and properly configured.
- Check your Git configuration with `git config --list` in the terminal.

### Database Connection Issues

- Verify that PostgreSQL is running on your system.
- Check that the connection details (host, port, database name, username) are correct.
- Ensure that your user has the necessary permissions to access the database.