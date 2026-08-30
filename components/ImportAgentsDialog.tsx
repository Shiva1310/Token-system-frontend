"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError, importAgents, type AgentImportResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, CheckCircle2, RefreshCw, XCircle, FileSpreadsheet } from "lucide-react";

export function ImportAgentsDialog({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<AgentImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setResult(null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const res = await importAgents(file);
      setResult(res);
      if (res.createdCount > 0 || res.updatedCount > 0) onImported();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to import agents");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="size-4" />
        Import Excel
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import agents from Excel</DialogTitle>
            <DialogDescription>
              Upload a spreadsheet with <strong>Name</strong> and{" "}
              <strong>Phone</strong> columns. New agents left without a phone
              number get a placeholder you can fill in later -- re-uploading
              an updated sheet will backfill the real phone for any agent
              that still has one.
            </DialogDescription>
          </DialogHeader>

          {!result ? (
            <div className="space-y-3">
              <Input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                disabled={uploading}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  <FileSpreadsheet className="size-4 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg border bg-muted/40 py-2">
                  <div className="text-lg font-semibold">{result.createdCount}</div>
                  <div className="text-xs text-muted-foreground">Added</div>
                </div>
                <div className="rounded-lg border bg-muted/40 py-2">
                  <div className="text-lg font-semibold">{result.updatedCount}</div>
                  <div className="text-xs text-muted-foreground">Phone updated</div>
                </div>
                <div className="rounded-lg border bg-muted/40 py-2">
                  <div className="text-lg font-semibold">{result.skippedCount}</div>
                  <div className="text-xs text-muted-foreground">Already existed</div>
                </div>
                <div className="rounded-lg border bg-muted/40 py-2">
                  <div className="text-lg font-semibold">{result.errorCount}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>

              {(result.created.length > 0 || result.updated.length > 0 || result.errors.length > 0) && (
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2 text-sm">
                  {result.created.map((a) => (
                    <div key={`created-${a.name}`} className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                      <span className="truncate">{a.name}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {a.phone}
                      </span>
                    </div>
                  ))}
                  {result.updated.map((a) => (
                    <div key={`updated-${a.name}`} className="flex items-center gap-2 text-foreground">
                      <RefreshCw className="size-3.5 shrink-0 text-blue-600" />
                      <span className="truncate">{a.name}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {a.oldPhone} → {a.newPhone}
                      </span>
                    </div>
                  ))}
                  {result.errors.map((e) => (
                    <div key={`${e.row}-${e.name}`} className="flex items-center gap-2 text-destructive">
                      <XCircle className="size-3.5 shrink-0" />
                      <span className="truncate">
                        Row {e.row}
                        {e.name ? ` (${e.name})` : ""}: {e.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!result ? (
              <>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={!file || uploading}>
                  {uploading ? "Importing..." : "Import"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setOpen(false)}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
