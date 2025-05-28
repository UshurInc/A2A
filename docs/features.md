## Custom Messages

> **Note: This feature is currently a work in progress and requires additional server infrastructure changes. The basic H2A functionality is demonstrated in the test client example.**

Custom messages extend the base H2A protocol to support domain-specific message types and metadata. This allows for more structured and type-safe communication between agents.

### Message Types

The system supports several predefined message types:

1. **Customer Service Messages**
   - Type: `customer_service`
   - Purpose: Handle customer inquiries and support requests
   - Metadata: Priority, department, customer ID, interaction history

2. **Order Messages**
   - Type: `order`
   - Purpose: Process and track order-related requests
   - Metadata: Order ID, status, items, payment information

3. **Support Ticket Messages**
   - Type: `support_ticket`
   - Purpose: Create and manage support tickets
   - Metadata: Ticket ID, category, severity, status

### Implementation Status

The custom messages feature is currently in development and requires:
1. Enhanced server-side validation for custom message types
2. Additional ACL and signature handling for custom messages
3. Server infrastructure updates to support metadata processing

For now, please use the test client example (`npm run test:client`) to demonstrate H2A functionality.

### Future Enhancements

Planned improvements for custom messages:
1. Standardized metadata schemas for each message type
2. Enhanced validation and error handling
3. Support for custom message type registration
4. Improved server-side processing of custom messages

### Example Usage

```typescript
// Create a customer service message
const message = client.createCustomerServiceMessage(
    "I have an issue with my recent order",
    "customer123",
    "high"
);

// Send the message
const taskId = await client.sendCustomMessage(message);
```

> **Note: The custom messages example (`npm run example:custom-messages`) is currently not working and will be updated in a future release.** 