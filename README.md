# NHMA AI Scout

General-purpose AI-assisted product discovery frontend backed by the existing Supabase NHMA services.

## Architecture

- Smart Search → `nhma-search`
- Independent chat → `nhma-chat`
- Health → `nhma-health`
- Stable session id persisted in the browser

No mock products are used. Product cards render only live backend results.
