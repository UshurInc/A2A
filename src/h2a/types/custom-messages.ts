import { H2AMessage } from './h2a-message';

// Base interface for all custom message types
export interface CustomH2AMessage extends H2AMessage {
    message_type: string;
    metadata?: Record<string, unknown>;
}

// Customer Service Message Type
export interface CustomerServiceMessage extends CustomH2AMessage {
    message_type: 'customer_service';
    metadata: {
        priority: 'low' | 'medium' | 'high';
        department: string;
        customer_id?: string;
        previous_interactions?: number;
    };
}

// Order Processing Message Type
export interface OrderMessage extends CustomH2AMessage {
    message_type: 'order';
    metadata: {
        order_id: string;
        order_type: 'new' | 'modification' | 'cancellation';
        items?: Array<{
            id: string;
            quantity: number;
        }>;
        payment_status?: 'pending' | 'completed' | 'failed';
    };
}

// Support Ticket Message Type
export interface SupportTicketMessage extends CustomH2AMessage {
    message_type: 'support_ticket';
    metadata: {
        ticket_id: string;
        category: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        assigned_to?: string;
        status: 'open' | 'in_progress' | 'resolved' | 'closed';
    };
}

// Message Type Registry
export const MessageTypes = {
    CUSTOMER_SERVICE: 'customer_service',
    ORDER: 'order',
    SUPPORT_TICKET: 'support_ticket'
} as const;

// Type guard functions
export function isCustomerServiceMessage(message: CustomH2AMessage): message is CustomerServiceMessage {
    return message.message_type === MessageTypes.CUSTOMER_SERVICE;
}

export function isOrderMessage(message: CustomH2AMessage): message is OrderMessage {
    return message.message_type === MessageTypes.ORDER;
}

export function isSupportTicketMessage(message: CustomH2AMessage): message is SupportTicketMessage {
    return message.message_type === MessageTypes.SUPPORT_TICKET;
} 