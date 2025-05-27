import { v4 as uuidv4 } from 'uuid';

async function testH2AFlow() {
    // Edge Agent endpoint
    const edgeUrl = 'http://localhost:41241/tasks/send';

    // Create a sample H2A message
    const taskId = uuidv4();
    const h2aMessage = {
        id: taskId,
        message: {
            role: 'user',
            parts: [{
                type: 'data',
                data: {
                    h2a: {
                        user_input: {
                            type: 'text',
                            value: 'I need to update my address'
                        },
                        interaction_goals: ['address_change', 'confirmation'],
                        user_situation: {
                            current_address: '123 Old St',
                            new_address: '456 New Ave'
                        },
                        user_expectations: {
                            confirmation_required: true,
                            preferred_contact: 'email'
                        }
                    }
                }
            }]
        },
        metadata: { source: 'test-client' }
    };

    // JSON-RPC envelope
    const jsonRpcRequest = {
        jsonrpc: '2.0',
        id: taskId,
        method: 'tasks/send',
        params: h2aMessage
    };

    try {
        console.log('Sending H2A message to Edge Agent...');
        const response = await fetch(edgeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonRpcRequest)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Initial response:', data);
    } catch (error) {
        console.error('Error during H2A flow:', error);
    }
}

// Run the test
console.log('Starting H2A test client...');
testH2AFlow().catch(console.error); 