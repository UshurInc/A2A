import { H2AClient } from '../src/h2a';
import { logger } from '../src/utils/logger';

async function main() {
    try {
        // Initialize H2A client
        const client = new H2AClient('http://localhost:41241');
        logger.info('H2A client initialized');

        // Create a sample H2A message
        const message = client.createH2AMessage(
            {
                type: 'text',
                value: 'I need to update my address'
            },
            [
                {
                    type: 'address_update',
                    value: 'Update current address'
                },
                {
                    type: 'contact_preference',
                    value: 'Set preferred contact method'
                }
            ],
            {
                current_address: '123 Main St, Anytown, USA',
                preferred_contact: 'email'
            }
        );

        logger.info('Created H2A message:', message);

        // Send the H2A task
        const taskId = await client.sendH2ATask(message);
        logger.info('H2A task sent successfully with ID:', taskId);

        // Subscribe to task updates
        const updates = await client.sendTaskSubscribe(taskId);
        for await (const update of updates) {
            logger.info('Received task update:', update);
            if (update.state === 'completed') {
                break;
            }
        }

    } catch (error) {
        logger.error('Error in H2A example:', error);
    }
}

// Run the example
main().catch(error => {
    logger.error('Unhandled error:', error);
    process.exit(1);
}); 