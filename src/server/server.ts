import express, { Request, Response } from 'express';
import cors from 'cors';
import { TaskContext, TaskYieldUpdate } from './handler';
import { AgentCard } from './schema';

export class A2AServer {
    private app: express.Application;
    private taskHandler: (context: TaskContext) => AsyncGenerator<TaskYieldUpdate>;
    private agentCard: AgentCard;
    private basePath: string;
    private corsOptions: boolean | string | undefined;

    constructor(
        taskHandler: (context: TaskContext) => AsyncGenerator<TaskYieldUpdate>,
        options: { card: AgentCard, basePath: string, corsOptions?: boolean | string | undefined }
    ) {
        this.taskHandler = taskHandler;
        this.agentCard = options.card;
        this.basePath = options.basePath;
        this.corsOptions = options.corsOptions;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        // Configure CORS
        if (this.corsOptions !== false) {
            const options =
                typeof this.corsOptions === "string"
                    ? { origin: this.corsOptions }
                    : this.corsOptions === true
                        ? undefined // Use default cors options if true
                        : this.corsOptions;
            this.app.use(cors(options));
        }

        // Middleware
        this.app.use(express.json()); // Parse JSON bodies
    }

    private setupRoutes() {
        // Agent Card endpoint
        this.app.get('/.well-known/agent.json', (req: Request, res: Response) => {
            res.json(this.agentCard);
        });

        // Task handling endpoint
        this.app.post('/tasks/send', async (req: Request, res: Response) => {
            try {
                const jsonRpcRequest = req.body;
                if (!jsonRpcRequest || jsonRpcRequest.jsonrpc !== '2.0' || !jsonRpcRequest.params) {
                    throw new Error('Invalid JSON-RPC request');
                }
                const task = jsonRpcRequest.params;
                console.log('Received task:', task);
                const context = new TaskContext(task);
                const updates = this.taskHandler(context);

                // Handle the first update
                const firstUpdate = await updates.next();
                res.json(firstUpdate.value);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                console.error('Error in /tasks/send:', errorMessage);
                res.status(500).json({ error: errorMessage });
            }
        });

        // Task subscription endpoint
        this.app.get('/tasks/:id/subscribe', async (req: Request, res: Response) => {
            const taskId = req.params.id;
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const context = new TaskContext({ id: taskId });
            const updates = this.taskHandler(context);

            try {
                for await (const update of updates) {
                    res.write(`data: ${JSON.stringify(update)}\n\n`);
                    if (update.state === 'completed') {
                        break;
                    }
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
            } finally {
                res.end();
            }
        });
    }

    public start(port: number = 41241): express.Application {
        // Start listening
        this.app.listen(port, () => {
            console.log(
                `A2A Server listening on port ${port} at path ${this.basePath}`
            );
        });

        return this.app;
    }
} 