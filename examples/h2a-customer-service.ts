import { H2AClient } from '../src/h2a';
import { logger } from '../src/utils/logger';

async function handleCustomerService() {
    try {
        // Initialize H2A client
        const client = new H2AClient('http://localhost:41241');
        logger.info('H2A client initialized for customer service');

        // Create a customer service H2A message
        const message = client.createH2AMessage(
            {
                type: 'customer_service',
                value: 'I have an issue with my recent order #12345'
            },
            [
                {
                    type: 'order_inquiry',
                    value: 'Check order status and details'
                },
                {
                    type: 'issue_resolution',
                    value: 'Resolve customer complaint'
                },
                {
                    type: 'customer_satisfaction',
                    value: 'Ensure customer satisfaction'
                }
            ],
            {
                current_address: '456 Business Ave, Suite 100',
                preferred_contact: 'phone'
            }
        );

        logger.info('Created customer service H2A message:', message);

        // Send the H2A task
        const taskId = await client.sendH2ATask(message);
        logger.info('Customer service task sent with ID:', taskId);

        // Subscribe to task updates with timeout
        const updates = await client.sendTaskSubscribe(taskId);
        let timeout = setTimeout(() => {
            logger.warn('Task update timeout reached');
            process.exit(0);
        }, 30000); // 30 second timeout

        try {
            for await (const update of updates) {
                logger.info('Received task update:', update);

                // Handle different update states
                switch (update.state) {
                    case 'working':
                        logger.info('Task is being processed...');
                        break;
                    case 'completed':
                        logger.info('Task completed successfully');
                        clearTimeout(timeout);
                        return;
                    case 'canceled':
                        logger.warn('Task was canceled');
                        clearTimeout(timeout);
                        return;
                }
            }
        } finally {
            clearTimeout(timeout);
        }

    } catch (error) {
        logger.error('Error in customer service example:', error);
        throw error;
    }
}

// Run the example with proper error handling
handleCustomerService().catch(error => {
    logger.error('Unhandled error in customer service example:', error);
    process.exit(1);
}); 