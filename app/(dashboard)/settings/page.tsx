"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ApiError,
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  type ManagedUser,
  type Role,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EntityCard } from "@/components/EntityCard";
import { PhoneLink } from "@/components/PhoneLink";
import { SearchInput } from "@/components/SearchInput";
import { Fab } from "@/components/Fab";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
];

const ACTIVE_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

interface UserFormState {
  name: string;
  phone: string;
  role: Role;
  password: string;
  active: string;
}

const EMPTY_FORM: UserFormState = {
  name: "",
  phone: "",
  role: "staff",
  password: "",
  active: "true",
};

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/customers");
    }
  }, [user, router]);

  function fetchUsers() {
    return getUsers()
      .then(setUsers)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to load users");
      })
      .finally(() => setLoading(false));
  }

  function load() {
    setLoading(true);
    fetchUsers();
  }

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetchUsers();
     
  }, [user]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (!user || user.role !== "admin") {
    return null;
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(u: ManagedUser) {
    setEditing(u);
    setForm({
      name: u.name,
      phone: u.phone,
      role: u.role,
      password: "",
      active: String(u.active),
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await updateUser(editing._id, {
          name: form.name,
          phone: form.phone,
          role: form.role,
          active: form.active === "true",
          ...(form.password ? { password: form.password } : {}),
        });
        toast.success("User updated");
      } else {
        await createUser({
          name: form.name,
          phone: form.phone,
          role: form.role,
          password: form.password,
          active: form.active === "true",
        });
        toast.success("User created");
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget._id);
      toast.success("User deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataTableColumn<ManagedUser>[] = [
    { key: "name", header: "Name", cell: (u) => u.name },
    { key: "phone", header: "Phone", cell: (u) => <PhoneLink phone={u.phone} /> },
    {
      key: "role",
      header: "Role",
      cell: (u) => <span className="capitalize">{u.role}</span>,
    },
    {
      key: "active",
      header: "Active",
      cell: (u) => (
        <Badge variant={u.active ? "default" : "outline"}>
          {u.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (u) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={`Edit ${u.name}`}
            onClick={() => openEdit(u)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Delete ${u.name}`}
            onClick={() => setDeleteTarget(u)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">Manage admin and staff user accounts.</p>
        </div>
        <Button onClick={openCreate} className="hidden md:inline-flex">
          New User
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search users..."
        className="max-w-sm"
      />

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable columns={columns} data={filteredUsers} rowKey={(u) => u._id} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No users found.
              </p>
            ) : (
              filteredUsers.map((u) => (
                <EntityCard
                  key={u._id}
                  name={u.name}
                  subtitle={<PhoneLink phone={u.phone} withIcon />}
                  onEdit={() => openEdit(u)}
                  onDelete={() => setDeleteTarget(u)}
                >
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="secondary" className="capitalize">
                      {u.role}
                    </Badge>
                    <Badge variant={u.active ? "default" : "outline"}>
                      {u.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </EntityCard>
              ))
            )}
          </div>
        </>
      )}

      <Fab label="New user" onClick={openCreate} />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "New User"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this user's account details."
                : "Create a new admin or staff account."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-phone">Phone</Label>
              <Input
                id="user-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-password">
                Password{editing ? " (leave blank to keep current)" : ""}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required={!editing}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, role: value as Role }))
                  }
                  items={ROLE_OPTIONS}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.active}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, active: value as string }))
                  }
                  items={ACTIVE_OPTIONS}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Save changes" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>&apos;s
              account. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
