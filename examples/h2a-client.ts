import { A2AClient } from '../src/server';

async function main() {
    // Create client for Edge Agent
    const edgeClient = new A2AClient('http://localhost:41241');

    // Example H2A message
    const h2aMessage = {
        user_input: {
            type: "text",
            value: "I need to update my address"
        },
        interaction_goals: ["address_change", "confirmation"],
        user_situation: {
            current_address: "123 Old St",
            preferred_contact: "email"
        }
    };

    try {
        // Send task to Edge Agent
        const task = await edgeClient.sendTask({
            message: {
                role: "user",
                parts: [{
                    type: "data",
                    data: { h2a: h2aMessage }
                }]
            }
        });

        console.log('Task sent successfully:', task);

        // Subscribe to task updates
        const subscription = await edgeClient.sendTaskSubscribe(task.id);

        // Handle streaming updates
        for await (const update of subscription) {
            console.log('Received update:', update);

            if (update.state === 'completed') {
                break;
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error); 