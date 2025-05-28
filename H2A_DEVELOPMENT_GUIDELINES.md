# H2A Development Guidelines

## Core Principles

1. **Separation of Concerns**
   - H2A-specific code should be isolated from core A2A implementation
   - All H2A functionality should be implemented in the `src/h2a` directory
   - Core A2A code in `src/server` should remain unchanged

2. **Directory Structure**
   ```
   src/h2a/
   ├── client/     # H2A-specific client implementations
   ├── server/     # H2A-specific server implementations
   ├── types/      # H2A-specific type definitions
   └── utils/      # H2A-specific utilities
   ```

3. **Implementation Rules**
   - Never modify files in `src/server` directory
   - Create new files in `src/h2a` for H2A-specific functionality
   - Use composition over modification when extending A2A functionality
   - Maintain backward compatibility with A2A protocol

4. **Message Handling**
   - H2A messages should be processed as a layer on top of A2A messages
   - Use middleware or decorators to add H2A-specific processing
   - Keep H2A message validation separate from A2A validation

5. **Testing**
   - Write tests for H2A-specific functionality
   - Ensure tests don't modify core A2A test files
   - Create separate test directories for H2A tests

## Relationship with A2A Codebase

### Extension vs Modification
H2A is implemented as an extension layer on top of the core A2A code, without modifying the main A2A implementation. This is achieved through:

1. **One-way Dependency**
   - H2A code imports from A2A (`import from '../../server'`)
   - A2A code doesn't import from H2A
   - Maintains a clean separation where H2A depends on A2A, not vice versa

2. **Composition Pattern**
   - `H2AClient` extends `A2AClient`
   - `H2AMiddleware` works alongside A2A's task handling
   - Custom message types are added as extensions

3. **Benefits**
   - Clean separation of concerns
   - Easy maintenance of both codebases
   - Ability to update A2A independently
   - No risk of breaking core A2A functionality

### Implementation Pattern

```typescript
// src/h2a/types/h2a-message.ts
export interface H2AMessage {
  // H2A-specific message structure
}

// src/h2a/server/h2a-middleware.ts
export class H2AMiddleware {
  // H2A-specific middleware implementation
}

// src/h2a/client/h2a-client.ts
export class H2AClient {
  // H2A-specific client implementation
}
```

## Best Practices

1. **Documentation**
   - Document all H2A-specific functionality
   - Keep documentation in sync with H2A profile specification
   - Use clear comments explaining H2A-specific decisions

2. **Error Handling**
   - Create H2A-specific error types
   - Handle H2A-specific errors separately from A2A errors
   - Provide clear error messages for H2A-specific issues

3. **Configuration**
   - Keep H2A-specific configuration separate
   - Use environment variables for H2A-specific settings
   - Document all H2A-specific configuration options

4. **Versioning**
   - Version H2A-specific functionality independently
   - Maintain compatibility with H2A profile specification
   - Document breaking changes in H2A functionality

## Development Workflow

1. **Adding New Features**
   - Create new files in appropriate `src/h2a` subdirectories
   - Implement H2A-specific functionality without modifying A2A code
   - Add tests for new H2A functionality
   - Update documentation

2. **Modifying Existing Features**
   - Identify H2A-specific components to modify
   - Make changes only in `src/h2a` directory
   - Update tests and documentation
   - Ensure backward compatibility

3. **Testing Changes**
   - Run H2A-specific tests
   - Verify A2A functionality remains unchanged
   - Test integration between H2A and A2A components

## Review Checklist

Before submitting changes:
- [ ] All changes are in `src/h2a` directory
- [ ] No modifications to `src/server` files
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] H2A profile specification compliance verified
- [ ] Backward compatibility maintained 

## FAQ

### Q: Are the `working-examples` and `add-h2a-profile` branches touching and changing any code implementation of the main branch from Google A2A, or are these only extensions without expecting any code main branch changes?

A: No, these branches are not touching or changing any code implementation of the main branch from Google A2A. They are purely extension layers that:
1. Add new functionality on top of A2A
2. Use A2A's existing interfaces and types
3. Maintain backward compatibility
4. Keep the core A2A implementation untouched

This approach allows for:
- Clean separation of concerns
- Easy maintenance of both codebases
- Ability to update A2A independently
- No risk of breaking core A2A functionality 