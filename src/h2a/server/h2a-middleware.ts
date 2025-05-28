import { TaskContext, TaskYieldUpdate } from '../../server/handler';
import { H2AMessage, H2ATask } from '../types/h2a-message';
import { logger, LogLevel } from '../../utils/logger';

export class H2AMiddleware {
    private static customLogger = logger.getLogger({
        component: 'H2AMiddleware',
        level: LogLevel.INFO
    });

    private static validateH2AMessage(message: H2AMessage): boolean {
        try {
            // Log the incoming message for debugging
            this.customLogger.info('Validating H2A message:', JSON.stringify(message, null, 2));

            // Check required fields
            if (!message.user_input || !message.interaction_goals || !message.user_situation) {
                this.customLogger.error('Missing required fields in H2A message:', {
                    hasUserInput: !!message.user_input,
                    hasInteractionGoals: !!message.interaction_goals,
                    hasUserSituation: !!message.user_situation
                });
                return false;
            }

            // Check user_input structure
            if (!message.user_input.type || !message.user_input.value) {
                this.customLogger.error('Invalid user_input structure:', message.user_input);
                return false;
            }

            // Check interaction_goals structure - support both string and object formats
            if (!Array.isArray(message.interaction_goals) || message.interaction_goals.length === 0) {
                this.customLogger.error('Invalid interaction_goals structure:', message.interaction_goals);
                return false;
            }

            // Validate each interaction goal
            for (const goal of message.interaction_goals) {
                if (typeof goal === 'string') {
                    // Test client format - simple string
                    continue;
                } else if (typeof goal === 'object' && goal !== null) {
                    // Custom message format - object with type and value
                    if (!goal.type || !goal.value) {
                        this.customLogger.error('Invalid interaction goal object:', goal);
                        return false;
                    }
                } else {
                    this.customLogger.error('Invalid interaction goal format:', goal);
                    return false;
                }
            }

            // For custom messages, validate additional fields
            if (message.message_type) {
                // Check ACL structure
                if (!message._acl || typeof message._acl !== 'object') {
                    this.customLogger.error('Invalid ACL structure for custom message:', message._acl);
                    return false;
                }

                // Check required ACL fields
                const requiredAclFields = ['user_input', 'interaction_goals', 'user_situation'] as const;
                for (const field of requiredAclFields) {
                    const aclField = message._acl[field];
                    if (!Array.isArray(aclField) || aclField.length === 0) {
                        this.customLogger.error(`Missing or invalid ACL field: ${field}`, aclField);
                        return false;
                    }
                    // Validate each ACL permission
                    for (const permission of aclField) {
                        if (typeof permission !== 'string') {
                            this.customLogger.error(`Invalid ACL permission in ${field}:`, permission);
                            return false;
                        }
                    }
                }

                // Check signature
                if (!message._sig) {
                    this.customLogger.error('Missing signature for custom message');
                    return false;
                }

                // Check metadata if present
                if (message.metadata && typeof message.metadata !== 'object') {
                    this.customLogger.error('Invalid metadata structure:', message.metadata);
                    return false;
                }
            }

            // Log successful validation with message type
            this.customLogger.info('H2A message validation successful:', {
                messageType: message.message_type || 'default',
                userInputType: message.user_input.type,
                goalsCount: message.interaction_goals.length,
                hasMetadata: !!message.metadata,
                hasAcl: !!message._acl,
                hasSignature: !!message._sig,
                aclFields: message._acl ? Object.keys(message._acl) : [],
                metadataFields: message.metadata ? Object.keys(message.metadata) : []
            });

            return true;
        } catch (error) {
            this.customLogger.error('Error validating H2A message:', error);
            return false;
        }
    }

    private static extractH2AMessage(task: H2ATask): H2AMessage | null {
        try {
            // Log the complete task for debugging
            this.customLogger.info('Extracting H2A message from task:', JSON.stringify(task, null, 2));

            const h2aMessage = task.message?.parts[0]?.data?.h2a;
            if (!h2aMessage) {
                this.customLogger.error('No H2A message found in task');
                return null;
            }

            // Log the extracted message
            this.customLogger.info('Extracted H2A message:', JSON.stringify(h2aMessage, null, 2));
            return h2aMessage;
        } catch (error) {
            this.customLogger.error('Error extracting H2A message:', error);
            return null;
        }
    }

    public static applyAccessControl(message: H2AMessage): H2AMessage {
        // Apply access control rules
        return {
            ...message,
            _acl: {
                user_input: ['read'],
                interaction_goals: ['read'],
                user_situation: ['read']
            }
        };
    }

    public static signMessage(message: H2AMessage): H2AMessage {
        // Add a dummy signature for now
        return {
            ...message,
            _sig: 'dummy-signature'
        };
    }

    public static async *processTask(
        context: TaskContext
    ): AsyncGenerator<TaskYieldUpdate, void, unknown> {
        const task = context.task as H2ATask;

        // Log the complete task
        this.customLogger.info('Received H2A task:', JSON.stringify(task, null, 2));

        const h2aMessage = this.extractH2AMessage(task);

        if (!h2aMessage) {
            yield {
                state: 'canceled',
                message: {
                    role: 'system',
                    parts: [{
                        type: 'text',
                        text: 'Invalid H2A message format'
                    }]
                }
            };
            return;
        }

        if (!this.validateH2AMessage(h2aMessage)) {
            yield {
                state: 'canceled',
                message: {
                    role: 'system',
                    parts: [{
                        type: 'text',
                        text: 'Invalid H2A message format'
                    }]
                }
            };
            return;
        }

        // Log the validated message
        this.customLogger.info('Processing validated H2A message:', JSON.stringify(h2aMessage, null, 2));

        // Process the message
        yield {
            state: 'working',
            message: {
                role: 'system',
                parts: [{
                    type: 'text',
                    text: 'Processing H2A message'
                }]
            }
        };

        // Return success
        yield {
            state: 'completed',
            message: {
                role: 'system',
                parts: [{
                    type: 'text',
                    text: 'H2A message processed successfully'
                }]
            }
        };
    }
} 