import { A2AClient } from '../src/server';
import { logger, LogLevel } from '../src/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import * as readline from 'readline';

// Create logger
const customLogger = logger.getLogger({
    component: 'H2AInteraction',
    level: LogLevel.INFO
});

// Create readline interface for CLI interaction
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// User Client
class UserClient {
    private client: A2AClient;
    private currentTaskId: string | null = null;
    private subscriptionTaskId: string | null = null;
    private subscriptionPromise: Promise<void> | null = null;

    constructor() {
        this.client = new A2AClient('http://localhost:41241');
    }

    private async *subscribeToUpdates(taskId: string): AsyncGenerator<any> {
        try {
            console.log(`\nSubscribing to updates for task ${taskId}...`);
            const updates = await this.client.sendTaskSubscribe(taskId);
            console.log('Subscription established. Waiting for responses...');

            for await (const update of updates) {
                console.log('\nReceived update:', JSON.stringify(update, null, 2));

                if (update.message?.parts?.[0]?.text) {
                    // Show all non-working state messages
                    if (update.state === 'completed') {
                        console.log('\nAgent:', update.message.parts[0].text);
                    }
                } else {
                    console.log('\nReceived update without text content:', update);
                }

                yield update;
            }
        } catch (error) {
            console.error('Error in subscription:', error);
            throw error;
        }
    }

    public async startChat() {
        try {
            // Create a task for the chat session
            const taskId = `chat-${Date.now()}`;
            this.subscriptionTaskId = taskId;
            console.log(`\nStarting chat session with task ID: ${taskId}`);

            // Start subscription in the background
            (async () => {
                try {
                    console.log('Starting subscription loop...');
                    for await (const update of this.subscribeToUpdates(taskId)) {
                        // Updates are handled in the generator
                    }
                } catch (error) {
                    console.error('Error in subscription loop:', error);
                }
            })();

            // Create initial H2A message
            const h2aMessage = {
                user_input: {
                    value: "Starting chat session",
                    type: "text"
                },
                interaction_goals: ["chat"],
                user_situation: {
                    context: "Starting a new chat session",
                    expectations: "To have a conversation with the business agent"
                },
                _acl: {
                    user_input: ["edge-agent", "router-agent", "business-agent"],
                    interaction_goals: ["router-agent", "business-agent"],
                    user_situation: ["business-agent"]
                }
            };

            // Create and send the task
            const task = {
                id: taskId,
                message: {
                    role: "user",
                    parts: [{
                        type: "data",
                        data: { h2a: h2aMessage }
                    }]
                }
            };

            console.log('\nSending initial task:', JSON.stringify(task, null, 2));
            await this.client.sendTask(task);
            console.log('Chat session started. Type your messages (type "exit" to end):');
        } catch (error) {
            console.error('Error starting chat:', error);
            throw error;
        }
    }

    public async sendMessage(message: string) {
        if (!this.subscriptionTaskId) {
            throw new Error('No active chat session');
        }

        try {
            // Create H2A message
            const h2aMessage = {
                user_input: {
                    value: message,
                    type: "text"
                },
                interaction_goals: ["chat"],
                user_situation: {
                    context: "In a chat session",
                    expectations: "To receive a response from the business agent"
                },
                _acl: {
                    user_input: ["edge-agent", "router-agent", "business-agent"],
                    interaction_goals: ["router-agent", "business-agent"],
                    user_situation: ["business-agent"]
                }
            };

            // Create and send the task
            const task = {
                id: this.subscriptionTaskId,
                message: {
                    role: "user",
                    parts: [{
                        type: "data",
                        data: { h2a: h2aMessage }
                    }]
                }
            };

            console.log('\nSending message task:', JSON.stringify(task, null, 2));
            await this.client.sendTask(task);
            console.log('\nYou:', message);
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }
}

// Main interaction flow
async function startInteraction() {
    console.log('Starting H2A Chat Demo');
    console.log('----------------------------');
    console.log('Type your messages below. Type "exit" to quit.');
    console.log('----------------------------\n');

    const userClient = new UserClient();

    // Start chat session in the background
    userClient.startChat().catch(console.error);

    // Start user interaction
    while (true) {
        const message = await new Promise<string>((resolve) => {
            rl.question('> ', (answer) => {
                resolve(answer);
            });
        });

        if (message.toLowerCase() === 'exit') {
            break;
        }

        await userClient.sendMessage(message);
    }

    rl.close();
}

// Run the interaction
console.log('Starting H2A chat demo...');
startInteraction().catch(console.error); 