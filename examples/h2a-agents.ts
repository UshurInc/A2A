import { A2AServer, A2AClient, TaskContext, TaskYieldUpdate, AgentCard } from '../src/server';

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

        // Process incoming H2A message
        const h2aData = task.message?.parts[0]?.data?.h2a;
        if (!h2aData) {
            throw new Error("Invalid H2A message format");
        }

        // Apply ACL and sign the message
        const processedH2a = {
            ...h2aData,
            _acl: this.applyAccessControl(h2aData),
            _sig: await this.signMessage(h2aData)
        };

        // Forward to Router Agent
        const routerClient = new A2AClient("http://localhost:41242");
        const routerTask = await routerClient.sendTask({
            message: {
                role: "agent",
                parts: [{
                    type: "data",
                    data: { h2a: processedH2a }
                }]
            }
        });

        yield {
            state: "completed",
            message: {
                role: "agent",
                parts: [{
                    type: "text",
                    text: "Human input processed and forwarded"
                }]
            }
        };
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

        // Validate signature and ACL
        const h2aData = task.message?.parts[0]?.data?.h2a;
        if (!h2aData || !await this.validateSignature(h2aData)) {
            throw new Error("Invalid H2A message signature");
        }

        // Route based on interaction goals
        const businessClient = new A2AClient("http://localhost:41243");
        const businessTask = await businessClient.sendTask({
            message: {
                role: "agent",
                parts: [{
                    type: "data",
                    data: { h2a: h2aData }
                }]
            }
        });

        yield {
            state: "completed",
            message: {
                role: "agent",
                parts: [{
                    type: "text",
                    text: "Message routed to business agent"
                }]
            }
        };
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
    }

    private async *handleTask(context: TaskContext): AsyncGenerator<TaskYieldUpdate> {
        const { task } = context;

        // Process business logic
        const h2aData = task.message?.parts[0]?.data?.h2a;
        if (!h2aData) {
            throw new Error("Invalid H2A message format");
        }

        // Example business logic processing
        const result = await this.processBusinessLogic(h2aData);

        yield {
            state: "completed",
            message: {
                role: "agent",
                parts: [{
                    type: "text",
                    text: result
                }]
            }
        };
    }

    private async processBusinessLogic(h2aData: any): Promise<string> {
        // Implement business logic
        return "Business logic processed successfully";
    }

    public start() {
        this.server.start(this.port);
        console.log(`Business Agent started on port ${this.port}`);
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
}

main().catch(console.error); 