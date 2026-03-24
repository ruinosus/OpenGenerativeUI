# AAP SDK Migration Report — CopilotKit/OpenGenerativeUI

Repo type: internal
Languages detected: Python, TypeScript

## Summary
This repository is a strong candidate for AAP SDK migration because it already contains multiple manifest-like concerns: agent system prompts, tool registries, MCP prompts/resources/tools, and frontend/backend glue for interactive UI generation. The highest-value migration targets are in the Python agent and the MCP service.

## Findings

### Layer 1 — Core

1. **Python system prompt in `apps/agent/main.py`**
   - Impact: high
   - Why it matters: This is the main agent instruction block and controls behavior for the whole Python agent.
   - Snippet: `system_prompt=f""" You are a helpful assistant that helps users understand CopilotKit and LangGraph used together. ... """`

2. **Python model configuration in `apps/agent/main.py`**
   - Impact: high
   - Why it matters: The agent is pinned to a specific `ChatOpenAI` model string directly in code.
   - Snippet: `model=ChatOpenAI(model="gpt-5.4-2026-03-05")`

3. **Visualization skill loading in `apps/agent/main.py`**
   - Impact: medium
   - Why it matters: External skill text is embedded into the system prompt at runtime and behaves like prompt content.
   - Snippet: `_skills_text = load_all_skills()`

4. **Seed template synchronization logic in `apps/agent/src/templates.py`**
   - Impact: medium
   - Why it matters: Template definitions are maintained as code and mirrored against frontend assets, making them good manifest candidates.
   - Snippet: `SEED_TEMPLATES: list[UITemplate] = [ { "id": "seed-weather-001", "name": "Weather", ... } ]`

5. **Template HTML loader in `apps/agent/src/templates.py`**
   - Impact: medium
   - Why it matters: The backend pulls HTML template content from the frontend source tree, coupling prompt/runtime state to artifact code.
   - Snippet: `seed_file = Path(__file__).resolve().parents[2] / "app" / "src" / "components" / "template-library" / "seed-templates.ts"`

6. **Form generation artifact in `apps/agent/src/form.py`**
   - Impact: medium
   - Why it matters: This tool returns a fixed UI specification; it is effectively a hardcoded artifact/template.
   - Snippet: `return json.dumps([ { "surfaceUpdate": { "surfaceId": "login-form", "components": components } }, ... ])`

### Layer 2 — Tools & Connections

7. **Python tool `query_data` in `apps/agent/src/query.py`**
   - Impact: medium
   - Why it matters: This is a LangChain tool exposed to the agent and a clear manifest tool candidate.
   - Snippet: `@tool def query_data(query: str): ... return _cached_data`

8. **Python tool `manage_todos` in `apps/agent/src/todos.py`**
   - Impact: medium
   - Why it matters: State-mutating tool that updates todo state through LangGraph commands.
   - Snippet: `@tool def manage_todos(todos: list[Todo], runtime: ToolRuntime) -> Command:`

9. **Python tool `get_todos` in `apps/agent/src/todos.py`**
   - Impact: low
   - Why it matters: Read-only state access tool that could be declared in a manifest.
   - Snippet: `@tool def get_todos(runtime: ToolRuntime): return runtime.state.get("todos", [])`

10. **Python tool `save_template` in `apps/agent/src/templates.py`**
    - Impact: medium
    - Why it matters: Adds reusable UI templates to agent state; a manifest tool/resource abstraction fits well.
    - Snippet: `@tool def save_template(..., runtime: ToolRuntime) -> Command:`

11. **Python tool `list_templates` in `apps/agent/src/templates.py`**
    - Impact: low
    - Why it matters: Read-only template registry listing, suitable for manifest-driven exposure.
    - Snippet: `@tool def list_templates(runtime: ToolRuntime):`

12. **Python tool `apply_template` in `apps/agent/src/templates.py`**
    - Impact: medium
    - Why it matters: Core interaction pattern for reusing template HTML; likely maps to an SDK tool or resource.
    - Snippet: `@tool def apply_template(runtime: ToolRuntime, name: str = "", template_id: str = ""):`

13. **Python tool `delete_template` in `apps/agent/src/templates.py`**
    - Impact: low
    - Why it matters: State mutation tool, likely declarable in manifests.
    - Snippet: `@tool def delete_template(template_id: str, runtime: ToolRuntime) -> Command:`

14. **Python tool `clear_pending_template` in `apps/agent/src/templates.py`**
    - Impact: low
    - Why it matters: State cleanup tool tied to frontend-driven selection flow.
    - Snippet: `@tool def clear_pending_template(runtime: ToolRuntime) -> Command:`

15. **MCP resources in `apps/mcp/src/server.ts`**
    - Impact: medium
    - Why it matters: The MCP server exposes `skills://list` and `skills://{name}` resources, which align well with manifest-described assets.
    - Snippet: `server.registerResource("skills-list", "skills://list", ... )`

16. **MCP prompts in `apps/mcp/src/server.ts`**
    - Impact: high
    - Why it matters: Pre-composed prompts are central to the server and are directly migration-ready.
    - Snippet: `server.registerPrompt("create_widget", { description: "Instructions for creating interactive HTML widgets" }, ...)`

17. **MCP tool `assemble_document` in `apps/mcp/src/server.ts`**
    - Impact: medium
    - Why it matters: A concrete tool exposed over MCP with a typed input schema.
    - Snippet: `server.registerTool("assemble_document", { description: ..., inputSchema: { title: z.string(), ... } }, ...)`

18. **MCP HTTP transport/session handling in `apps/mcp/src/index.ts`**
    - Impact: medium
    - Why it matters: Server transport, session map, and origin configuration are connection-layer concerns that may become manifest/config driven.
    - Snippet: `const sessions = new Map<string, WebStandardStreamableHTTPServerTransport>();`

19. **MCP stdio transport in `apps/mcp/src/stdio.ts`**
    - Impact: low
    - Why it matters: Alternate transport entrypoint; useful but not core business logic.
    - Snippet: `const transport = new StdioServerTransport();`

20. **MCP skill loading helpers in `apps/mcp/src/skills.ts`**
    - Impact: medium
    - Why it matters: Skill catalog loading is part of the server’s prompt/resource system and is likely migration-relevant.
    - Snippet: `import { listSkills, loadSkill } from "./skills.js";`

### Layer 3 — Frontend

21. **Next.js app dependency set in `apps/app/package.json`**
    - Impact: medium
    - Why it matters: The app already depends on CopilotKit runtime/UI packages and AG-UI middleware, indicating active frontend-agent integration.
    - Snippet: `"@copilotkit/react-core": "next", "@copilotkit/react-ui": "next", "@copilotkit/runtime": "next"`

22. **Frontend integration packages in `apps/app/package.json`**
    - Impact: medium
    - Why it matters: The presence of `@ag-ui/a2ui-middleware` and `@ag-ui/mcp-apps-middleware` indicates architecture that may map onto AAP manifests.
    - Snippet: `"@ag-ui/a2ui-middleware": "^0.0.2", "@ag-ui/mcp-apps-middleware": "^0.0.3"`

### Layer 4 — Governance

23. **No explicit guardrail/validation layer found in the scanned application code**
    - Impact: low
    - Why it matters: There are no obvious sanitization or moderation hooks in the core agent/tool code, suggesting a gap for future governance manifests.
    - Snippet: `system_prompt=f""" ... """`

### Layer 5 — Polish

24. **Hardcoded English UI text in `apps/agent/src/form.py`**
    - Impact: low
    - Why it matters: Strings like “Welcome back”, “Sign in to your account”, and “Don’t have an account?” are hardcoded and not localized.
    - Snippet: `"literalString": "Welcome back"`

25. **Hardcoded English descriptions in `apps/agent/src/templates.py`**
    - Impact: low
    - Why it matters: Seed template metadata uses user-facing English copy directly in code.
    - Snippet: `"description": "Current weather conditions card with temperature, humidity, wind, and UV index"`

26. **Hardcoded theme/class references in MCP renderer-related code**
    - Impact: low
    - Why it matters: The UI assembly layer likely encodes design-system decisions directly in code.
    - Snippet: `wraps HTML with OpenGenerativeUI theme CSS, SVG classes, form styles, and bridge JS`

## Migration sizing estimate
- High impact candidates: 4
- Medium impact candidates: 11
- Low impact candidates: 11
- Total findings: 26

## Proposed AAP SDK structure
- `.aap/agent/manifest.yaml`
- `.aap/agent/prompts/system_prompt.md`
- `.aap/agent/tools/query_data.yaml`
- `.aap/agent/tools/manage_todos.yaml`
- `.aap/agent/tools/get_todos.yaml`
- `.aap/agent/tools/save_template.yaml`
- `.aap/agent/tools/list_templates.yaml`
- `.aap/agent/tools/apply_template.yaml`
- `.aap/agent/tools/delete_template.yaml`
- `.aap/agent/tools/clear_pending_template.yaml`
- `.aap/agent/artifacts/seed-templates.yaml`
- `.aap/mcp/manifest.yaml`
- `.aap/mcp/prompts/create_widget.md`
- `.aap/mcp/prompts/create_svg_diagram.md`
- `.aap/mcp/prompts/create_visualization.md`
- `.aap/mcp/tools/assemble_document.yaml`
- `.aap/frontend/manifest.yaml`
- `.aap/governance/guardrails.yaml`
