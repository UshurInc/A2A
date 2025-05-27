export interface AgentCard {
    name: string;
    description: string;
    url: string;
    version: string;
    capabilities: {
        streaming: boolean;
        pushNotifications: boolean;
    };
    skills: Array<{
        id: string;
        name: string;
        description: string;
        inputModes: string[];
        outputModes: string[];
    }>;
}

export interface AgentCapabilities {
    streaming: boolean;
    pushNotifications: boolean;
}

export interface AgentSkill {
    id: string;
    name: string;
    description: string;
    inputModes: string[];
    outputModes: string[];
}

export interface TaskStatusUpdateEvent {
    id: string;
    status: TaskStatus;
    final?: boolean;
    metadata?: Record<string, unknown> | null;
}

export interface TaskArtifactUpdateEvent {
    id: string;
    artifact: Artifact;
    final?: boolean;
    metadata?: Record<string, unknown> | null;
} 