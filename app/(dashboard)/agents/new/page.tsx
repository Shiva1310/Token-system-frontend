import { AgentForm } from "@/components/AgentForm";

export default function NewAgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Agent</h1>
        <p className="text-muted-foreground">Add a new recruiting agent.</p>
      </div>
      <AgentForm />
    </div>
  );
}
