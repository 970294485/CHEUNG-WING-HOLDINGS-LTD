"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Search, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  date: string;
  expectedDate: string | null;
  totalAmount: number;
  status: string;
  notes: string | null;
  items: any[];
}

interface Product {
  id: string;
  sku: string;
  name: string;
  cost: number;
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    poNumber: "",
    vendorName: "",
    date: new Date().toISOString().split('T')[0],
    expectedDate: "",
    notes: "",
  });

  const [orderItems, setOrderItems] = useState<{productId: string, quantity: number, unitPrice: number}[]>([]);

  // TODO: Get real companyId from auth context
  const companyId = "cm7g83z1e000008l4hj123456"; // Mock companyId for now

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`/api/purchase-orders?companyId=${companyId}`),
        fetch(`/api/products?companyId=${companyId}`)
      ]);
      
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data);
      }
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = () => {
    // Generate a default PO number
    const today = new Date();
    const dateStr = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    setFormData({
      poNumber: `PO-${dateStr}-${randomNum}`,
      vendorName: "",
      date: today.toISOString().split('T')[0],
      expectedDate: "",
      notes: "",
    });
    setOrderItems([]);
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...orderItems];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newItems[index] = { 
        ...newItems[index], 
        productId: value,
        unitPrice: product ? Number(product.cost) : 0
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderItems.length === 0) {
      alert("請至少添加一項產品");
      return;
    }

    if (orderItems.some(item => !item.productId)) {
      alert("請為所有明細選擇產品");
      return;
    }

    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          ...formData,
          items: orderItems,
        }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save purchase order");
      }
    } catch (error) {
      console.error("Error saving purchase order:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此採購單嗎？")) return;

    try {
      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete purchase order");
      }
    } catch (error) {
      console.error("Error deleting purchase order:", error);
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">草稿</span>;
      case "PENDING": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">待處理</span>;
      case "APPROVED": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">已批准</span>;
      case "COMPLETED": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">已完成</span>;
      case "CANCELLED": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">已取消</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">採購單資料輸入</h1>
          <p className="text-muted-foreground">管理向供應商採購產品的訂單。與 <Link href="/sales/inventory-procurement" className="text-blue-500 hover:underline">庫存及採購</Link> 模組數據互通。</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/sales/inventory-procurement">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" /> 庫存及採購管理
            </Button>
          </Link>
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 h-4 w-4" /> 新增採購單
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋單號或供應商名稱..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>單號</TableHead>
              <TableHead>供應商</TableHead>
              <TableHead>採購日期</TableHead>
              <TableHead>預計交貨</TableHead>
              <TableHead className="text-right">總金額</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  載入中...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  找不到採購單
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium font-mono">{order.poNumber}</TableCell>
                  <TableCell>{order.vendorName}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell>{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-right tabular-nums">${Number(order.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)} title="刪除單據">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增採購單</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poNumber">採購單號 <span className="text-red-500">*</span></Label>
                <Input
                  id="poNumber"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorName">供應商名稱 <span className="text-red-500">*</span></Label>
                <Input
                  id="vendorName"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">採購日期 <span className="text-red-500">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDate">預計交貨日期</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備註</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">採購明細</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-2 h-4 w-4" /> 加入產品
                </Button>
              </div>

              {orderItems.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground border rounded-md border-dashed">
                  請點擊右上方按鈕加入採購產品
                </div>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-md bg-zinc-50 dark:bg-zinc-900/50">
                      <div className="flex-1 space-y-2">
                        <Select 
                          value={item.productId} 
                          onValueChange={(val) => handleItemChange(index, 'productId', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇產品..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.sku} - {p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24 space-y-2">
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="數量"
                          value={item.quantity || ''} 
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="單價"
                          value={item.unitPrice || ''} 
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="mt-0.5" onClick={() => handleRemoveItem(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2 pr-12">
                    <div className="text-lg font-bold">
                      總計: <span className="tabular-nums">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                建立採購單
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
