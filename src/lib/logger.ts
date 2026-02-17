import { prisma } from "@/lib/prisma";

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

export class Logger {
    static async log(level: LogLevel, message: string, details?: any, userId?: string) {
        try {
            await prisma.systemLog.create({
                data: {
                    level,
                    message,
                    details: details ? details : undefined,
                    userId,
                },
            });
        } catch (error) {
            console.error("Failed to write system log:", error);
        }
    }

    static async info(message: string, details?: any, userId?: string) {
        return this.log('INFO', message, details, userId);
    }

    static async warn(message: string, details?: any, userId?: string) {
        return this.log('WARN', message, details, userId);
    }

    static async error(message: string, details?: any, userId?: string) {
        return this.log('ERROR', message, details, userId);
    }

    static async success(message: string, details?: any, userId?: string) {
        return this.log('SUCCESS', message, details, userId);
    }
}
