import winston from 'winston';
import type { Logform } from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    TRACE = 'trace'
}

export interface LoggerConfig {
    level: LogLevel;
    component: string;
    logDir?: string;
}

interface LogInfo {
    timestamp: string;
    level: string;
    message: string;
    component: string;
    [key: string]: any;
}

class Logger {
    private static instance: Logger;
    private loggers: Map<string, winston.Logger> = new Map();
    private defaultLogDir = path.join(process.cwd(), 'logs');

    private constructor() { }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private createLogger(config: LoggerConfig): winston.Logger {
        const { level, component, logDir = this.defaultLogDir } = config;

        // Create log directory if it doesn't exist
        if (!require('fs').existsSync(logDir)) {
            require('fs').mkdirSync(logDir, { recursive: true });
        }

        const logger = winston.createLogger({
            level,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            defaultMeta: { component },
            transports: [
                // Console transport
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf((info: Logform.TransformableInfo) => {
                            const { timestamp, level, message, component, ...meta } = info;
                            return `${timestamp} [${component}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
                        })
                    )
                }),
                // File transport with rotation
                new winston.transports.DailyRotateFile({
                    filename: path.join(logDir, `${component}-%DATE%.log`),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '14d',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                })
            ]
        });

        return logger;
    }

    getLogger(config: LoggerConfig): winston.Logger {
        const key = `${config.component}-${config.level}`;
        if (!this.loggers.has(key)) {
            this.loggers.set(key, this.createLogger(config));
        }
        return this.loggers.get(key)!;
    }

    setLogLevel(component: string, level: LogLevel): void {
        const key = `${component}-${level}`;
        if (this.loggers.has(key)) {
            const logger = this.loggers.get(key)!;
            logger.level = level;
        }
    }
}

export const logger = Logger.getInstance(); 