# Global Claude Code Instructions

## Documentation & Code Examples

When looking up documentation for any library, framework, or package, use the Context7 MCP server to fetch the latest docs rather than relying on training data. This ensures code examples and API references are current.

## Post-Implementation Cleanup

After completing a build or implementation (especially after plan mode), automatically run the `/code-simplifier` plugin to clean up and refactor the code before considering the task complete. This ensures code stays lean and maintainable.
