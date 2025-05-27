export interface Task {
    id?: string;
    message?: {
        role: string;
        parts: Array<{
            type: string;
            text?: string;
            data?: any;
        }>;
    };
}

export interface TaskYieldUpdate {
    state: 'working' | 'completed' | 'canceled';
    message?: {
        role: string;
        parts: Array<{
            type: string;
            text?: string;
            data?: any;
        }>;
    };
    name?: string;
    mimeType?: string;
    parts?: Array<{
        text: string;
    }>;
}

export class TaskContext {
    public task: Task;
    private cancelled: boolean = false;

    constructor(task: Task) {
        this.task = task;
    }

    public isCancelled(): boolean {
        return this.cancelled;
    }

    public cancel(): void {
        this.cancelled = true;
    }
} 