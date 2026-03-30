"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

interface SalesDocumentFormProps {
  type: "QUOTATION" | "CONTRACT" | "PROFORMA_INVOICE";
  initialData?: any;
  isEdit?: boolean;
}

export function SalesDocumentForm({ type, initialData, isEdit }: SalesDocumentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const defaultFormData = {
    customerId: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
    status: "DRAFT",
    items: [
      { productId: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, total: 0 }
    ]
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    // Fetch customers
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data))
      .catch((err) => console.error("Failed to fetch customers:", err));

    // Fetch products
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        // #region agent log
        fetch('http://127.0.0.1:7562/ingest/25b6807d-6a78-480b-9773-0fa4b4bd4303',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d5412d'},body:JSON.stringify({sessionId:'d5412d',location:'components/sales/SalesDocumentForm.tsx:43',message:'Fetch products response',data:{dataType: typeof data, isArray: Array.isArray(data), data},timestamp:Date.now(),runId:'run1',hypothesisId:'1'})}).catch(()=>{});
        // #endregion
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error("Products API returned non-array:", data);
          setProducts([]);
        }
      })
      .catch((err) => console.error("Failed to fetch products:", err));
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        customerId: initialData.customerId || "",
        date: initialData.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : "",
        notes: initialData.notes || "",
        status: initialData.status || "DRAFT",
        items: initialData.items && initialData.items.length > 0 
          ? initialData.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              discount: Number(item.discount),
              taxRate: Number(item.taxRate),
              total: Number(item.total),
            }))
          : defaultFormData.items
      });
    }
  }, [initialData]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: value };

    // Auto-fill unit price when product is selected
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        item.unitPrice = Number(product.price) || 0;
      }
    }

    // Calculate total
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.taxRate / 100);
    item.total = afterDiscount + taxAmount;

    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, total: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      alert("請選擇客戶");
      return;
    }
    if (formData.items.some((item) => !item.productId)) {
      alert("請選擇產品");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/sales-documents/${initialData.id}` : "/api/sales-documents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          customerId: formData.customerId,
          date: formData.date,
          dueDate: formData.dueDate || null,
          notes: formData.notes,
          status: formData.status,
          totalAmount: calculateTotalAmount(),
          items: formData.items,
        }),
      });

      if (res.ok) {
        alert(isEdit ? "更新成功！" : "創建成功！");
        
        // Redirect based on type
        if (type === "QUOTATION") router.push("/sales/quotes");
        else if (type === "CONTRACT") router.push("/sales/contracts");
        else if (type === "PROFORMA_INVOICE") router.push("/sales/proforma-invoices");
        
      } else {
        const err = await res.json();
        alert(`操作失敗: ${err.error}`);
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("操作失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    const action = isEdit ? "編輯" : "新增";
    if (type === "QUOTATION") return `${action}報價單 (見積)`;
    if (type === "CONTRACT") return `${action}合同`;
    if (type === "PROFORMA_INVOICE") return `${action}預收發票`;
    return `${action}單據`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{getTitle()}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="customer">客戶 <span className="text-red-500">*</span></Label>
                <button
                  type="button"
                  onClick={() => router.push("/customers/list/new")}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + 新增客戶
                </button>
              </div>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData({ ...formData, customerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇客戶" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">日期 <span className="text-red-500">*</span></Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">有效期限/到期日</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">狀態</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">草稿 (Draft)</SelectItem>
                  <SelectItem value="PENDING">待處理 (Pending)</SelectItem>
                  <SelectItem value="CONFIRMED">已確認 (Confirmed)</SelectItem>
                  <SelectItem value="CANCELLED">已取消 (Cancelled)</SelectItem>
                  <SelectItem value="COMPLETED">已完成 (Completed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">備註</Label>
              <Textarea
                id="notes"
                placeholder="輸入備註信息..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>產品明細</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              添加產品
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end border p-4 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="col-span-12 md:col-span-3 space-y-2">
                  <Label>產品 <span className="text-red-500">*</span></Label>
                  <Select
                    value={item.productId}
                    onValueChange={(value) => handleItemChange(index, "productId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇產品" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-6 md:col-span-2 space-y-2">
                  <Label>數量</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                  />
                </div>

                <div className="col-span-6 md:col-span-2 space-y-2">
                  <Label>單價</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, "unitPrice", Number(e.target.value))}
                  />
                </div>

                <div className="col-span-4 md:col-span-1 space-y-2">
                  <Label>折扣(%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discount}
                    onChange={(e) => handleItemChange(index, "discount", Number(e.target.value))}
                  />
                </div>

                <div className="col-span-4 md:col-span-1 space-y-2">
                  <Label>稅率(%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={item.taxRate}
                    onChange={(e) => handleItemChange(index, "taxRate", Number(e.target.value))}
                  />
                </div>

                <div className="col-span-4 md:col-span-2 space-y-2">
                  <Label>小計</Label>
                  <Input
                    type="number"
                    readOnly
                    value={item.total.toFixed(2)}
                    className="bg-zinc-100 dark:bg-zinc-800"
                  />
                </div>

                <div className="col-span-12 md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t mt-6">
              <div className="text-right">
                <p className="text-sm text-zinc-500 mb-1">總計金額</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                  ¥{calculateTotalAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}
