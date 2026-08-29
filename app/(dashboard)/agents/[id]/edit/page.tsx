"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError, getAgents, type Agent } from "@/lib/api";
import { AgentForm } from "@/components/AgentForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditAgentPage() {
  const params = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAgents()
      .then((agents) => {
        const found = agents.find((a) => a._id === params.id);
        if (!found) {
          toast.error("Agent not found");
          return;
        }
        setAgent(found);
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to load agent");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Agent</h1>
        <p className="text-muted-foreground">Update this agent&apos;s details.</p>
      </div>
      {loading ? (
        <Skeleton className="h-64 max-w-lg" />
      ) : agent ? (
        <AgentForm agent={agent} />
      ) : (
        <p className="text-muted-foreground">Agent not found.</p>
      )}
    </div>
  );
}
