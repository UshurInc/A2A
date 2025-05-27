import { Task, TaskYieldUpdate } from './handler';
import { AgentCard } from './schema';

export class A2AClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    }

    private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data as T;
    }

    public async getAgentCard(): Promise<AgentCard> {
        return this.fetch<AgentCard>('/.well-known/agent.json');
    }

    public async sendTask(task: Task): Promise<TaskYieldUpdate> {
        // Send as JSON-RPC envelope
        const jsonRpcRequest = {
            jsonrpc: '2.0',
            id: task.id || Math.random().toString(36).slice(2),
            method: 'tasks/send',
            params: task
        };
        return this.fetch<TaskYieldUpdate>('/tasks/send', {
            method: 'POST',
            body: JSON.stringify(jsonRpcRequest),
        });
    }

    public async sendTaskSubscribe(taskId: string): Promise<AsyncGenerator<TaskYieldUpdate, void, unknown>> {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}/subscribe`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        async function* generateUpdates(): AsyncGenerator<TaskYieldUpdate, void, unknown> {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6)) as TaskYieldUpdate;
                            yield data;
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        }

        return generateUpdates();
    }
} 