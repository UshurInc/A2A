import { CustomMessageClient } from '../src/h2a/client/custom-message-client';
import { logger, LogLevel } from '../src/utils/logger';

// Get a logger instance for this component
const customLogger = logger.getLogger({
    component: 'CustomMessagesExample',
    level: LogLevel.INFO
});

async function demonstrateCustomMessages() {
    try {
        const client = new CustomMessageClient('http://localhost:41241');
        customLogger.info('Custom message client initialized');

        // Example 1: Customer Service Message
        const customerServiceMessage = client.createCustomerServiceMessage(
            'My order #12345 is delayed',
            'CUST123',
            'high'
        );

        // Example 2: Order Message
        const orderMessage = client.createOrderMessage(
            'ORD12345',
            'processing',
            [
                { id: 'ITEM1', quantity: 2 },
                { id: 'ITEM2', quantity: 1 }
            ]
        );

        // Example 3: Support Ticket Message
        const supportTicketMessage = client.createSupportTicketMessage(
            'TICKET789',
            'technical',
            'Cannot access my account'
        );

        // Send all messages
        const messages = [
            { name: 'Customer Service', message: customerServiceMessage },
            { name: 'Order', message: orderMessage },
            { name: 'Support Ticket', message: supportTicketMessage }
        ];

        for (const { name, message } of messages) {
            try {
                customLogger.info(`Sending ${name} message...`);
                const taskId = await client.sendCustomMessage(message);
                customLogger.info(`${name} message sent successfully with task ID:`, taskId);

                // Subscribe to updates
                const updates = await client.sendTaskSubscribe(taskId);
                for await (const update of updates) {
                    customLogger.info(`Received update for ${name} message:`, update);
                    if (update.state === 'completed') {
                        break;
                    }
                }
            } catch (error) {
                customLogger.error(`Error processing ${name} message:`, error);
            }
        }

    } catch (error) {
        customLogger.error('Error in custom messages example:', error);
        throw error;
    }
}

// Run the example
demonstrateCustomMessages().catch(error => {
    customLogger.error('Unhandled error:', error);
    process.exit(1);
}); 