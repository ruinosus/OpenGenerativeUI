import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { useManifest } from "@/contexts/manifest-context";

// Build Zod schema from manifest HITL tool parameters
function buildHITLZodSchema(tool: any): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const p of tool.parameters ?? []) {
    let field: z.ZodTypeAny;
    if (p.type === "enum" && p.values) {
      field = z.enum(p.values as [string, ...string[]]);
    } else if (p.type === "boolean") {
      field = z.boolean();
    } else if (p.type === "number") {
      field = z.number();
    } else {
      field = z.string();
    }
    if (p.description) field = field.describe(p.description);
    shape[p.name] = p.optional ? field.optional() : field;
  }
  return z.object(shape);
}

export function useHITLActions() {
  const manifest = useManifest();
  const hitlTools = manifest?.spec?.hitl?.tools ?? [];

  for (const tool of hitlTools) {
    useHumanInTheLoop({
      name: tool.name,
      description: tool.description,
      parameters: buildHITLZodSchema(tool),
      render: ({ args, respond, status }) => {
        const fields = (tool.ui?.fields ?? []).map((f: any) => ({
          label: f.label || f.name,
          value: args?.[f.name] ?? "",
        }));
        const isLive = !!respond;  // Hides buttons on historic replay
        return (
          <div className="border rounded-xl p-3">
            <h3 className="font-semibold">{tool.title || tool.name}</h3>
            <dl className="space-y-1 mt-2">
              {fields.map((f: any) => (
                <div key={f.label}>
                  <dt className="text-xs uppercase text-gray-500">{f.label}</dt>
                  <dd className="text-sm">{String(f.value)}</dd>
                </div>
              ))}
            </dl>
            {isLive && (
              <div className="flex gap-2 mt-3">
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded"
                  onClick={() => respond?.("accepted")}
                >Accept</button>
                <button
                  className="px-3 py-1 bg-gray-300 rounded"
                  onClick={() => respond?.("rejected")}
                >Reject</button>
              </div>
            )}
          </div>
        );
      },
    }, [manifest]);
  }
}
