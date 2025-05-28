#!/usr/bin/env node

import { logManager } from './log-manager';
import { LogLevel } from './logger';

// Register components
const components = [
    'EdgeAgent',
    'RouterAgent',
    'BusinessAgent',
    'A2AServer',
    'TestClient'
];

components.forEach(component => logManager.registerComponent(component));

// Helper function to normalize log level
function normalizeLogLevel(level: string): LogLevel {
    const normalizedLevel = level.toLowerCase();
    const validLevel = Object.values(LogLevel).find(
        l => l.toLowerCase() === normalizedLevel
    );
    if (!validLevel) {
        throw new Error(`Invalid log level: ${level}. Must be one of: ${Object.values(LogLevel).join(', ')}`);
    }
    return validLevel as LogLevel;
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'list':
        console.log('Registered components:');
        console.log(logManager.getComponents().join('\n'));
        break;

    case 'levels':
        console.log('Current log levels:');
        const levels = logManager.getCurrentLevels();
        Object.entries(levels).forEach(([component, level]) => {
            console.log(`${component}: ${level}`);
        });
        break;

    case 'set':
        if (args.length !== 3) {
            console.error('Usage: set <component> <level>');
            process.exit(1);
        }
        const [_, component, level] = args;
        try {
            const normalizedLevel = normalizeLogLevel(level);
            logManager.setLogLevel(component, normalizedLevel);
            console.log(`Set ${component} log level to ${normalizedLevel}`);
        } catch (error) {
            console.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
        break;

    case 'set-all':
        if (args.length !== 2) {
            console.error('Usage: set-all <level>');
            process.exit(1);
        }
        try {
            const normalizedLevel = normalizeLogLevel(args[1]);
            logManager.setAllLogLevels(normalizedLevel);
            console.log(`Set all components log level to ${normalizedLevel}`);
        } catch (error) {
            console.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
        break;

    default:
        console.log(`
Log Manager CLI

Usage:
  list                    List all registered components
  levels                  Show current log levels for all components
  set <component> <level> Set log level for a specific component
  set-all <level>        Set log level for all components

Log levels (case-insensitive):
  ${Object.values(LogLevel).join('\n  ')}
`);
        process.exit(1);
} 