"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomerGroup {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    customers: number;
  };
  createdAt: string;
}

interface CustomerFollowUp {
  id: string;
  customerId: string;
  type: string;
  content: string;
  date: string;
  customer: {
    id: string;
    name: string;
  };
}

interface CustomerSource {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    customers: number;
  };
  createdAt: string;
}

export default function GroupsFollowupSourcesPage() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [sources, setSources] = useState<CustomerSource[]>([]);
  const [followUps, setFollowUps] = useState<CustomerFollowUp[]>([]);
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<CustomerFollowUp | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [followUpFormData, setFollowUpFormData] = useState({
    customerId: "",
    type: "PHONE",
    content: "",
    date: "",
  });

  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<CustomerSource | null>(null);
  const [sourceFormData, setSourceFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchGroups(), fetchFollowUps(), fetchCustomers(), fetchSources()]);
    setLoading(false);
  };

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/customer-sources");
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/customer-groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const fetchFollowUps = async () => {
    try {
      const res = await fetch("/api/customer-follow-ups");
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data);
      }
    } catch (error) {
      console.error("Failed to fetch follow-ups:", error);
    }
  };

  const handleOpenDialog = (group?: CustomerGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || "",
      });
    } else {
      setEditingGroup(null);
      setFormData({ name: "", description: "" });
    }
    setIsDialogOpen(true);
  };

  const handleOpenFollowUpDialog = (followUp?: CustomerFollowUp) => {
    if (followUp) {
      setEditingFollowUp(followUp);
      setFollowUpFormData({
        customerId: followUp.customerId,
        type: followUp.type,
        content: followUp.content,
        date: new Date(followUp.date).toISOString().slice(0, 16), // Format for datetime-local
      });
    } else {
      setEditingFollowUp(null);
      setFollowUpFormData({
        customerId: "",
        type: "PHONE",
        content: "",
        date: new Date().toISOString().slice(0, 16),
      });
    }
    setIsFollowUpDialogOpen(true);
  };

  const handleOpenSourceDialog = (source?: CustomerSource) => {
    if (source) {
      setEditingSource(source);
      setSourceFormData({
        name: source.name,
        description: source.description || "",
      });
    } else {
      setEditingSource(null);
      setSourceFormData({ name: "", description: "" });
    }
    setIsSourceDialogOpen(true);
  };

  const handleSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSource 
        ? `/api/customer-sources/${editingSource.id}` 
        : "/api/customer-sources";
      const method = editingSource ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sourceFormData),
      });

      if (res.ok) {
        setIsSourceDialogOpen(false);
        fetchSources();
      } else {
        const data = await res.json();
        alert(data.error || "保存失敗");
      }
    } catch (error) {
      console.error("Failed to save source:", error);
    }
  };

  const handleSourceDelete = async (id: string) => {
    if (!confirm("確定要刪除此來源嗎？")) return;
    
    try {
      const res = await fetch(`/api/customer-sources/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSources();
      }
    } catch (error) {
      console.error("Failed to delete source:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingGroup 
        ? `/api/customer-groups/${editingGroup.id}` 
        : "/api/customer-groups";
      const method = editingGroup ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to save group:", error);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingFollowUp && !followUpFormData.customerId) {
      alert("請選擇客戶");
      return;
    }

    try {
      const url = editingFollowUp 
        ? `/api/customer-follow-ups/${editingFollowUp.id}` 
        : "/api/customer-follow-ups";
      const method = editingFollowUp ? "PUT" : "POST";

      const body = editingFollowUp 
        ? {
            type: followUpFormData.type,
            content: followUpFormData.content,
            date: new Date(followUpFormData.date).toISOString(),
          }
        : {
            customerId: followUpFormData.customerId,
            type: followUpFormData.type,
            content: followUpFormData.content,
            date: new Date(followUpFormData.date).toISOString(),
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsFollowUpDialogOpen(false);
        fetchFollowUps();
      }
    } catch (error) {
      console.error("Failed to save follow-up:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此分組嗎？")) return;
    
    try {
      const res = await fetch(`/api/customer-groups/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  const handleFollowUpDelete = async (id: string) => {
    if (!confirm("確定要刪除此跟進記錄嗎？")) return;
    
    try {
      const res = await fetch(`/api/customer-follow-ups/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchFollowUps();
      }
    } catch (error) {
      console.error("Failed to delete follow-up:", error);
    }
  };

  const getFollowUpTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      EMAIL: "郵件",
      PHONE: "電話",
      MEETING: "會議",
      OTHER: "其他"
    };
    return types[type] || type;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">分組 / 跟進 / 來源管理</h1>
        <p className="text-muted-foreground mt-2">
          管理客戶分組、查看跟進記錄以及配置客戶來源。
        </p>
      </div>

      <Tabs defaultValue="groups" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="groups">分組管理</TabsTrigger>
          <TabsTrigger value="followups">跟進記錄</TabsTrigger>
          <TabsTrigger value="sources">客戶來源</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">客戶分組列表</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  新建分組
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingGroup ? "編輯分組" : "新建分組"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">分組名稱 <span className="text-red-500">*</span></Label>
                    <Input 
                      id="name" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">描述</Label>
                    <Textarea 
                      id="description" 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3} 
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      取消
                    </Button>
                    <Button type="submit">保存</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>分組名稱</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>客戶數量</TableHead>
                  <TableHead>創建時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      加載中...
                    </TableCell>
                  </TableRow>
                ) : groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      暫無分組數據
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="text-muted-foreground">{group.description || "-"}</TableCell>
                      <TableCell>{group._count?.customers || 0}</TableCell>
                      <TableCell>{new Date(group.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenDialog(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(group.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="followups" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">跟進記錄</h2>
            <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenFollowUpDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  新建跟進記錄
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingFollowUp ? "編輯跟進記錄" : "新建跟進記錄"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFollowUpSubmit} className="space-y-4 pt-4">
                  {!editingFollowUp && (
                    <div className="space-y-2">
                      <Label htmlFor="customerId">客戶 <span className="text-red-500">*</span></Label>
                      <Select 
                        value={followUpFormData.customerId} 
                        onValueChange={(value) => setFollowUpFormData({ ...followUpFormData, customerId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選擇客戶" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="type">跟進方式</Label>
                    <Select 
                      value={followUpFormData.type} 
                      onValueChange={(value) => setFollowUpFormData({ ...followUpFormData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇跟進方式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PHONE">電話</SelectItem>
                        <SelectItem value="EMAIL">郵件</SelectItem>
                        <SelectItem value="MEETING">會議</SelectItem>
                        <SelectItem value="OTHER">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">跟進內容 <span className="text-red-500">*</span></Label>
                    <Textarea 
                      id="content" 
                      value={followUpFormData.content}
                      onChange={(e) => setFollowUpFormData({ ...followUpFormData, content: e.target.value })}
                      required 
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">跟進時間 <span className="text-red-500">*</span></Label>
                    <Input 
                      id="date" 
                      type="datetime-local"
                      value={followUpFormData.date}
                      onChange={(e) => setFollowUpFormData({ ...followUpFormData, date: e.target.value })}
                      required 
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsFollowUpDialogOpen(false)}>
                      取消
                    </Button>
                    <Button type="submit">保存</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>客戶名稱</TableHead>
                  <TableHead>跟進方式</TableHead>
                  <TableHead>跟進內容</TableHead>
                  <TableHead>跟進時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      加載中...
                    </TableCell>
                  </TableRow>
                ) : followUps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      暫無跟進記錄
                    </TableCell>
                  </TableRow>
                ) : (
                  followUps.map((followUp) => (
                    <TableRow key={followUp.id}>
                      <TableCell className="font-medium">{followUp.customer.name}</TableCell>
                      <TableCell>{getFollowUpTypeLabel(followUp.type)}</TableCell>
                      <TableCell className="max-w-md truncate" title={followUp.content}>
                        {followUp.content}
                      </TableCell>
                      <TableCell>{new Date(followUp.date).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenFollowUpDialog(followUp)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleFollowUpDelete(followUp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">客戶來源列表</h2>
            <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenSourceDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  新建來源
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSource ? "編輯來源" : "新建來源"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSourceSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="source-name">來源名稱 <span className="text-red-500">*</span></Label>
                    <Input 
                      id="source-name" 
                      value={sourceFormData.name}
                      onChange={(e) => setSourceFormData({ ...sourceFormData, name: e.target.value })}
                      required 
                      placeholder="例如: 展會、官網、推薦"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source-description">描述</Label>
                    <Textarea 
                      id="source-description" 
                      value={sourceFormData.description}
                      onChange={(e) => setSourceFormData({ ...sourceFormData, description: e.target.value })}
                      rows={3} 
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsSourceDialogOpen(false)}>
                      取消
                    </Button>
                    <Button type="submit">保存</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>來源名稱</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>客戶數量</TableHead>
                  <TableHead>創建時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      加載中...
                    </TableCell>
                  </TableRow>
                ) : sources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      暫無來源數據
                    </TableCell>
                  </TableRow>
                ) : (
                  sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="font-medium">{source.name}</TableCell>
                      <TableCell className="text-muted-foreground">{source.description || "-"}</TableCell>
                      <TableCell>{source._count?.customers || 0}</TableCell>
                      <TableCell>{new Date(source.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenSourceDialog(source)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleSourceDelete(source.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
