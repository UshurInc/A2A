import { A2AServer, A2AClient, TaskContext, TaskYieldUpdate, AgentCard } from '../src/server';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// Create readline interface for CLI interaction
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Create a logger for the Business Agent
const logStream = fs.createWriteStream(path.join(__dirname, 'business-agent.log'), { flags: 'a' });
const log = (message: string) => {
    const timestamp = new Date().toISOString();
    logStream.write(`${timestamp} - ${message}\n`);
};

// Edge Agent Implementation
class EdgeAgent {
    private server: A2AServer;
    private agentCard: AgentCard;
    private port: number = 41241;

    constructor() {
        this.agentCard = {
            name: "H2A Edge Agent",
            description: "Captures and secures human input for A2A processing",
            url: `http://localhost:${this.port}`,
            version: "1.0.0",
            capabilities: {
                streaming: true,
                pushNotifications: true
            },
            skills: [{
                id: "capture_human_input",
                name: "Capture Human Input",
                description: "Securely captures and processes human input for A2A routing",
                inputModes: ["text", "form"],
                outputModes: ["text", "json"]
            }]
        };

        this.server = new A2AServer(this.handleTask.bind(this), {
            card: this.agentCard,
            basePath: '/tasks/send',
            corsOptions: true
        });
    }

    private async *handleTask(context: TaskContext): AsyncGenerator<TaskYieldUpdate> {
        const { task } = context;
        const taskId = task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        log(`\n=== Edge Agent: Task ${taskId} ===`);
        log(`A2A Message Received: ${JSON.stringify(task, null, 2)}`);

        // For subscription requests, just yield a completion update
        if (!task.message) {
            log(`Edge Agent: Establishing subscription for task ${taskId}`);
            const update: TaskYieldUpdate = {
                state: "completed",
                message: {
                    role: "agent",
                    parts: [{
                        type: "text",
                        text: "Subscription established"
                    }]
                }
            };
            log(`Edge Agent: Sending A2A Update: ${JSON.stringify(update, null, 2)}`);
            yield update;
            return;
        }

        // Process incoming H2A message
        const h2aData = task.message?.parts[0]?.data?.h2a;
        if (!h2aData) {
            log('Edge Agent: Invalid H2A message format received');
            throw new Error("Invalid H2A message format");
        }

        log(`Edge Agent: H2A Message Details:`);
        log(`- User Input: ${h2aData.user_input?.value}`);
        log(`- Interaction Goals: ${h2aData.interaction_goals?.join(', ')}`);
        log(`- User Situation: ${h2aData.user_situation?.context}`);

        // Apply ACL and sign the message
        const processedH2a = {
            ...h2aData,
            _acl: this.applyAccessControl(h2aData),
            _sig: await this.signMessage(h2aData)
        };

        log(`Edge Agent: Processed H2A Message:`);
        log(`- ACL: ${JSON.stringify(processedH2a._acl, null, 2)}`);
        log(`- Signature: ${processedH2a._sig}`);

        // Forward to Router Agent
        const routerClient = new A2AClient("http://localhost:41242");
        const routerTask = {
            id: taskId,
            message: {
                role: "agent",
                parts: [{
                    type: "data",
                    data: { h2a: processedH2a }
                }]
            }
        };
        log(`Edge Agent: Forwarding A2A Message to Router: ${JSON.stringify(routerTask, null, 2)}`);
        await routerClient.sendTask(routerTask);

        log(`Edge Agent: Subscribing to updates for task ${taskId}`);
        const updates = await routerClient.sendTaskSubscribe(taskId);
        for await (const update of updates) {
            log(`Edge Agent: Received A2A Update: ${JSON.stringify(update, null, 2)}`);
            yield update;
        }
    }

    private applyAccessControl(h2aData: any) {
        // Implement field-level access control
        return {
            user_input: ["router-agent", "business-agent"],
            interaction_goals: ["router-agent"],
            user_situation: ["business-agent"]
        };
    }

    private async signMessage(h2aData: any): Promise<string> {
        // Implement JWS-style signing
        return "JWS-signature-placeholder";
    }

    public start() {
        this.server.start(this.port);
        console.log(`Edge Agent started on port ${this.port}`);
    }
}

// Router Agent Implementation
class RouterAgent {
    private server: A2AServer;
    private agentCard: AgentCard;
    private port: number = 41242;

    constructor() {
        this.agentCard = {
            name: "H2A Router Agent",
            description: "Routes H2A messages to appropriate business agents",
            url: `http://localhost:${this.port}`,
            version: "1.0.0",
            capabilities: {
                streaming: true,
                pushNotifications: true
            },
            skills: [{
                id: "route_h2a_message",
                name: "Route H2A Message",
                description: "Routes H2A messages based on goals and ACL",
                inputModes: ["json"],
                outputModes: ["json"]
            }]
        };

        this.server = new A2AServer(this.handleTask.bind(this), {
            card: this.agentCard,
            basePath: '/tasks/send',
            corsOptions: true
        });
    }

    private async *handleTask(context: TaskContext): AsyncGenerator<TaskYieldUpdate> {
        const { task } = context;
        const taskId = task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        log(`\n=== Router Agent: Task ${taskId} ===`);
        log(`A2A Message Received: ${JSON.stringify(task, null, 2)}`);

        // For subscription requests, just yield a completion update
        if (!task.message) {
            log(`Router Agent: Establishing subscription for task ${taskId}`);
            const update: TaskYieldUpdate = {
                state: "completed",
                message: {
                    role: "agent",
                    parts: [{
                        type: "text",
                        text: "Subscription established"
                    }]
                }
            };
            log(`Router Agent: Sending A2A Update: ${JSON.stringify(update, null, 2)}`);
            yield update;
            return;
        }

        // Validate signature and ACL
        const h2aData = task.message?.parts[0]?.data?.h2a;
        if (!h2aData || !await this.validateSignature(h2aData)) {
            log('Router Agent: Invalid H2A message signature');
            throw new Error("Invalid H2A message signature");
        }

        log(`Router Agent: H2A Message Details:`);
        log(`- User Input: ${h2aData.user_input?.value}`);
        log(`- Interaction Goals: ${h2aData.interaction_goals?.join(', ')}`);
        log(`- User Situation: ${h2aData.user_situation?.context}`);
        log(`- ACL: ${JSON.stringify(h2aData._acl, null, 2)}`);
        log(`- Signature: ${h2aData._sig}`);

        // Route based on interaction goals
        const businessClient = new A2AClient("http://localhost:41243");
        const businessTask = {
            id: taskId,
            message: {
                role: "agent",
                parts: [{
                    type: "data",
                    data: { h2a: h2aData }
                }]
            }
        };
        log(`Router Agent: Forwarding A2A Message to Business Agent: ${JSON.stringify(businessTask, null, 2)}`);
        await businessClient.sendTask(businessTask);

        log(`Router Agent: Subscribing to updates for task ${taskId}`);
        const updates = await businessClient.sendTaskSubscribe(taskId);
        for await (const update of updates) {
            log(`Router Agent: Received A2A Update: ${JSON.stringify(update, null, 2)}`);
            yield update;
        }
    }

    private async validateSignature(h2aData: any): Promise<boolean> {
        // Implement signature validation
        return true;
    }

    public start() {
        this.server.start(this.port);
        console.log(`Router Agent started on port ${this.port}`);
    }
}

// Business Agent Implementation
class BusinessAgent {
    private server: A2AServer;
    private agentCard: AgentCard;
    private port: number = 41243;
    private rl: readline.Interface;
    private currentPrompt: ((answer: string) => void) | null = null;

    constructor() {
        this.agentCard = {
            name: "H2A Business Agent",
            description: "Handles business logic for H2A requests",
            url: `http://localhost:${this.port}`,
            version: "1.0.0",
            capabilities: {
                streaming: true,
                pushNotifications: true
            },
            skills: [{
                id: "process_business_logic",
                name: "Process Business Logic",
                description: "Executes business logic based on H2A requests",
                inputModes: ["json"],
                outputModes: ["text", "json"]
            }]
        };

        this.server = new A2AServer(this.handleTask.bind(this), {
            card: this.agentCard,
            basePath: '/tasks/send',
            corsOptions: true
        });

        // Create readline interface with separate output stream
        const outputStream = fs.createWriteStream('/dev/null');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: outputStream
        });

        // Set up input handling
        this.rl.on('line', (input) => {
            if (this.currentPrompt) {
                const prompt = this.currentPrompt;
                this.currentPrompt = null;
                prompt(input);
            }
        });
    }

    private async getAgentResponse(h2aData: any): Promise<string> {
        // Log the incoming message
        log(`\nUser: ${h2aData.user_input.value}`);
        log(`Context: ${h2aData.user_situation.context}`);
        log(`Goals: ${h2aData.interaction_goals.join(', ')}`);

        return new Promise((resolve) => {
            this.currentPrompt = (answer) => {
                if (answer.trim()) {
                    log(`Agent response: ${answer}`);
                    resolve(answer);
                } else {
                    // If empty response, ask again
                    this.getAgentResponse(h2aData).then(resolve);
                }
            };
            // Write prompt to log file only
            log('\nYour response: ');
        });
    }

    private async *handleTask(context: TaskContext): AsyncGenerator<TaskYieldUpdate> {
        const { task } = context;
        const taskId = task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        log(`\n=== Business Agent: Task ${taskId} ===`);
        log(`A2A Message Received: ${JSON.stringify(task, null, 2)}`);

        // For subscription requests, establish chat session
        if (!task.message) {
            log(`Business Agent: Establishing chat session for task ${taskId}`);
            const welcomeUpdate: TaskYieldUpdate = {
                state: "completed",
                message: {
                    role: "agent",
                    parts: [{
                        type: "text",
                        text: "Chat session established. How can I help you today?"
                    }]
                }
            };
            log(`Business Agent: Sending A2A Welcome Update: ${JSON.stringify(welcomeUpdate, null, 2)}`);
            yield welcomeUpdate;
            return;
        }

        // Process business logic
        const h2aData = task.message?.parts[0]?.data?.h2a;
        if (!h2aData) {
            log('Business Agent: Invalid H2A message format received');
            throw new Error("Invalid H2A message format");
        }

        log(`Business Agent: H2A Message Details:`);
        log(`- User Input: ${h2aData.user_input?.value}`);
        log(`- Interaction Goals: ${h2aData.interaction_goals?.join(', ')}`);
        log(`- User Situation: ${h2aData.user_situation?.context}`);
        log(`- ACL: ${JSON.stringify(h2aData._acl, null, 2)}`);
        log(`- Signature: ${h2aData._sig}`);

        // Get agent's response through CLI
        const response = await this.getAgentResponse(h2aData);

        // Only send response if we have one
        if (response && response.trim()) {
            log(`Business Agent: Preparing response for task ${taskId}: ${response}`);

            // Send the response with completed state
            const update: TaskYieldUpdate = {
                state: "completed",
                message: {
                    role: "agent",
                    parts: [{
                        type: "text",
                        text: response
                    }]
                }
            };

            log(`Business Agent: Sending A2A Update: ${JSON.stringify(update, null, 2)}`);
            try {
                yield update;
                log(`Business Agent: Update successfully yielded for task ${taskId}`);
            } catch (error) {
                log(`Business Agent: Error yielding update for task ${taskId}: ${error}`);
                throw error;
            }
        } else {
            log(`Business Agent: No response to send for task ${taskId}`);
        }
    }

    public start() {
        this.server.start(this.port);
        log(`Business Agent started on port ${this.port}`);
        log('Waiting for messages...');
        log('Business Agent started. Check business-agent.log for details.');
    }

    public stop() {
        this.rl.close();
        logStream.end();
    }
}

// Example usage
async function main() {
    const edgeAgent = new EdgeAgent();
    const routerAgent = new RouterAgent();
    const businessAgent = new BusinessAgent();

    // Start agents in sequence to avoid port conflicts
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for ports to be released
    edgeAgent.start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    routerAgent.start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    businessAgent.start();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down agents...');
        businessAgent.stop();
        process.exit(0);
    });
}

main().catch(console.error); 