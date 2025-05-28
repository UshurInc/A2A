import { logger as loggerInstance, LogLevel } from './logger';

export class LogManager {
    private static instance: LogManager;
    private components: Set<string> = new Set();

    private constructor() { }

    static getInstance(): LogManager {
        if (!LogManager.instance) {
            LogManager.instance = new LogManager();
        }
        return LogManager.instance;
    }

    registerComponent(component: string) {
        this.components.add(component);
    }

    setLogLevel(component: string, level: LogLevel) {
        if (!this.components.has(component)) {
            throw new Error(`Component ${component} not registered`);
        }
        loggerInstance.setLogLevel(component, level);
    }

    setAllLogLevels(level: LogLevel) {
        this.components.forEach(component => {
            loggerInstance.setLogLevel(component, level);
        });
    }

    getComponents(): string[] {
        return Array.from(this.components);
    }

    getCurrentLevels(): Record<string, LogLevel> {
        const levels: Record<string, LogLevel> = {};
        this.components.forEach(component => {
            const componentLogger = loggerInstance.getLogger({ component, level: LogLevel.INFO });
            levels[component] = componentLogger.level as LogLevel;
        });
        return levels;
    }
}

export const logManager = LogManager.getInstance(); 