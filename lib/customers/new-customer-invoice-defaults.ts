/** 發票 202500062 — 用於「新增客戶」表單預填（買方欄位） */

export type CustomerFormFields = {
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  source: string;
  status: string;
  groupId: string;
};

export const emptyCustomerForm = (): CustomerFormFields & { followUps: unknown[] } => ({
  name: "",
  code: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
  source: "",
  status: "ACTIVE",
  groupId: "",
  followUps: [],
});

/** 與發票買方對齊的預設（客戶編號可視需要修改後再儲存） */
export const newCustomerDefaultsFromInvoice202500062 = (): CustomerFormFields => ({
  name: "THUAN AN SERVICE IMPORT EXPORT CO., LTD",
  code: "CUST-INV-202500062",
  contactPerson: "",
  email: "",
  phone: "",
  address:
    "PHAM NGU LAO STREET-KA LONG WARD-MONG CAI CITY-QUANG NINH PROVINCE (越南廣寧省芒街市卡隆坊范五老街)",
  taxId: "",
  source: "發票提取",
  status: "ACTIVE",
  groupId: "",
});
