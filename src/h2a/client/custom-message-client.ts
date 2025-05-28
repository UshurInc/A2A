import { H2AClient } from './h2a-client';
import {
    CustomH2AMessage,
    CustomerServiceMessage,
    OrderMessage,
    SupportTicketMessage,
    MessageTypes
} from '../types/custom-messages';
import { logger, LogLevel } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class CustomMessageClient extends H2AClient {
    constructor(baseUrl: string) {
        super(baseUrl);
        this.customLogger = logger.getLogger({
            component: 'CustomMessageClient',
            level: LogLevel.INFO
        });
    }

    public createCustomerServiceMessage(
        query: string,
        customerId: string,
        priority: 'low' | 'medium' | 'high'
    ): CustomerServiceMessage {
        const metadata = {
            priority,
            department: 'customer_support',
            customer_id: customerId,
            previous_interactions: 0
        };

        // Create base H2A message with metadata
        const h2aMessage = this.createH2AMessage(
            {
                type: 'text',
                value: query
            },
            [
                {
                    type: 'customer_service',
                    value: 'handle_inquiry'
                }
            ],
            {
                preferred_contact: 'email'
            },
            MessageTypes.CUSTOMER_SERVICE,
            metadata
        );

        return h2aMessage as CustomerServiceMessage;
    }

    public createOrderMessage(
        orderId: string,
        status: 'pending' | 'processing' | 'shipped' | 'delivered',
        items: Array<{ id: string; quantity: number }>
    ): OrderMessage {
        const metadata = {
            order_id: orderId,
            order_type: 'new',
            items,
            payment_status: 'pending'
        };

        // Create base H2A message with metadata
        const h2aMessage = this.createH2AMessage(
            {
                type: 'text',
                value: `Order status update for order ${orderId}`
            },
            [
                {
                    type: 'order',
                    value: 'update_status'
                }
            ],
            {
                preferred_contact: 'email'
            },
            MessageTypes.ORDER,
            metadata
        );

        return h2aMessage as OrderMessage;
    }

    public createSupportTicketMessage(
        ticketId: string,
        category: string,
        description: string
    ): SupportTicketMessage {
        const metadata = {
            ticket_id: ticketId,
            category,
            severity: 'medium',
            status: 'open'
        };

        // Create base H2A message with metadata
        const h2aMessage = this.createH2AMessage(
            {
                type: 'text',
                value: description
            },
            [
                {
                    type: 'support_ticket',
                    value: 'create_ticket'
                }
            ],
            {
                preferred_contact: 'email'
            },
            MessageTypes.SUPPORT_TICKET,
            metadata
        );

        return h2aMessage as SupportTicketMessage;
    }

    public async sendCustomMessage(message: CustomH2AMessage): Promise<string> {
        try {
            // Validate message type
            if (!message.message_type) {
                throw new Error('Message type is required for custom messages');
            }

            // Log message type for debugging
            this.customLogger.info(`Sending ${message.message_type} message`);

            // Create task with proper structure
            const taskId = uuidv4();
            const task = {
                id: taskId,
                message: {
                    role: 'user',
                    parts: [{
                        type: 'data',
                        data: {
                            h2a: {
                                ...message,
                                _acl: message._acl || {
                                    user_input: ['read'],
                                    interaction_goals: ['read'],
                                    user_situation: ['read']
                                },
                                _sig: message._sig || 'dummy-signature'
                            }
                        }
                    }]
                }
            };

            // Log the task for debugging
            this.customLogger.info('Sending task:', JSON.stringify(task, null, 2));

            // Send the task using the base A2A client
            const response = await this.sendTask(task);
            if (!response) {
                throw new Error('No response received from server');
            }

            // Log the response for debugging
            this.customLogger.info('Task response:', JSON.stringify(response, null, 2));

            // Return the task ID we generated
            return taskId;
        } catch (error) {
            this.customLogger.error('Error sending custom message:', error);
            throw error;
        }
    }
} 