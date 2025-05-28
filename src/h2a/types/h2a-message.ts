import { Task } from '../../server/handler';

export interface H2AMessage {
    user_input: {
        type: string;
        value: string;
    };
    interaction_goals: Array<string | { type: string; value: string }>;
    user_situation: Record<string, any>;
    message_type?: string;
    _acl?: {
        user_input: string[];
        interaction_goals: string[];
        user_situation: string[];
        [key: string]: string[]; // Allow additional ACL fields
    };
    _sig?: string;
    metadata?: Record<string, any>; // Add metadata field
}

export interface H2ATask extends Task {
    id: string;
    message: {
        role: string;
        parts: Array<{
            type: string;
            data?: {
                h2a: H2AMessage;
            };
        }>;
    };
}

export interface H2AAccessControl {
    user_input: string[];
    interaction_goals: string[];
    user_situation: string[];
}

export interface H2ASignature {
    signature: string;
    algorithm: string;
    keyId: string;
} 