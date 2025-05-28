import { A2AClient } from '../../server/client';
import { Task } from '../../server/handler';
import { H2AMessage, H2ATask } from '../types/h2a-message';
import { H2AMiddleware } from '../server/h2a-middleware';
import { logger, LogLevel } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class H2AClient extends A2AClient {
    protected customLogger;

    constructor(baseUrl: string) {
        super(baseUrl);
        this.customLogger = logger.getLogger({
            component: 'H2AClient',
            level: LogLevel.INFO
        });
    }

    public async sendH2ATask(h2aMessage: H2AMessage): Promise<string> {
        try {
            // Create H2A task with a unique ID
            const taskId = uuidv4();
            const task: H2ATask = {
                id: taskId,
                message: {
                    role: 'user',
                    parts: [
                        {
                            type: 'data',
                            data: {
                                h2a: {
                                    ...h2aMessage,
                                    _acl: h2aMessage._acl || {
                                        user_input: ['read'],
                                        interaction_goals: ['read'],
                                        user_situation: ['read']
                                    },
                                    _sig: h2aMessage._sig || 'dummy-signature'
                                }
                            }
                        }
                    ]
                }
            };

            // Log the task for debugging
            this.customLogger.info('Sending H2A task:', JSON.stringify(task, null, 2));

            // Send task using A2A client
            const response = await this.sendTask(task);
            if (!response) {
                throw new Error('No response received from server');
            }

            // Log the response for debugging
            this.customLogger.info('H2A task response:', JSON.stringify(response, null, 2));
            return taskId; // Return the ID we generated
        } catch (error) {
            this.customLogger.error('Error sending H2A task:', error);
            throw error;
        }
    }

    public createH2AMessage(
        userInput: { type: string; value: string },
        interactionGoals: Array<{ type: string; value: string }>,
        userSituation: Record<string, any>,
        messageType?: string,
        metadata?: Record<string, any>
    ): H2AMessage {
        // Create base message with access control
        const message: H2AMessage = {
            user_input: userInput,
            interaction_goals: interactionGoals,
            user_situation: userSituation,
            _acl: {
                user_input: ['read'],
                interaction_goals: ['read'],
                user_situation: ['read']
            },
            _sig: 'dummy-signature'
        };

        // Add message type if provided
        if (messageType) {
            message.message_type = messageType;
        }

        // Add metadata if provided
        if (metadata) {
            message.metadata = metadata;
        }

        // Log the created message for debugging
        this.customLogger.info('Created H2A message:', JSON.stringify(message, null, 2));

        // Apply access control and sign message
        const processedMessage = H2AMiddleware.applyAccessControl(message);
        return H2AMiddleware.signMessage(processedMessage);
    }
} 