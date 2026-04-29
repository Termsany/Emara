import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function formatEGP(amount: number | null | undefined): string {
  const v = typeof amount === "number" ? amount : 0;
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  })
    .format(v)
    .replace("EGP", "ج.م")
    .replace("E£", "ج.م");
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    return format(new Date(date), "d MMM yyyy", { locale: ar });
  } catch {
    return "—";
  }
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffInSeconds < 60) return "الآن";
  if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
  if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
  if (diffInSeconds < 30 * 86400) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
  return formatDate(date);
}

export const projectStatusLabels: Record<string, string> = {
  new_lead: "عميل جديد",
  quotation_sent: "عرض سعر مُرسل",
  contract_signed: "عقد موقع",
  site_survey: "معاينة الموقع",
  planning_2d: "مخططات 2D",
  mood_board: "موود بورد",
  design_3d: "تصميم 3D",
  client_review: "مراجعة العميل",
  shop_drawings: "رسومات تنفيذية",
  boq: "جدول الكميات",
  execution_ready: "جاهز للتنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const stageStatusLabels: Record<string, string> = {
  locked: "مغلق",
  not_started: "لم يبدأ",
  in_progress: "قيد التنفيذ",
  waiting_client_approval: "بانتظار موافقة العميل",
  revision_required: "يحتاج مراجعة",
  approved: "مُعتمد",
  completed: "مكتمل",
};

export const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  sales: "مبيعات",
  designer: "مصمم",
  draftsman: "رسام",
  qs: "حصر كميات",
  accountant: "محاسب",
  client: "عميل",
};

export const projectTypeLabels: Record<string, string> = {
  villa: "فيلا",
  apartment: "شقة",
  office: "مكتب",
  clinic: "عيادة",
  retail_store: "محل تجاري",
  restaurant: "مطعم",
  other: "أخرى",
};

export const designStyleLabels: Record<string, string> = {
  modern: "حديث",
  classic: "كلاسيكي",
  neoclassical: "نيوكلاسيك",
  minimal: "بساطة",
  japandi: "جابندي",
  industrial: "صناعي",
  contemporary: "معاصر",
  luxury: "فاخر",
};

export const scopeTypeLabels: Record<string, string> = {
  design_only: "تصميم فقط",
  design_shop_drawings: "تصميم + رسومات تنفيذية",
  design_supervision: "تصميم + إشراف",
  design_execution: "تصميم + تنفيذ",
  turnkey: "تسليم مفتاح",
};

export const fileCategoryLabels: Record<string, string> = {
  contract: "عقد",
  site_survey: "معاينة موقع",
  mood_board: "موود بورد",
  plan_2d: "مخطط 2D",
  render_3d: "تصميم 3D",
  shop_drawing: "رسومات تنفيذية",
  boq: "جدول كميات",
  invoice: "فاتورة",
  other: "أخرى",
};

export const approvalStatusLabels: Record<string, string> = {
  pending: "بانتظار الرد",
  approved: "مُعتمد",
  approved_with_comments: "مُعتمد مع ملاحظات",
  revision_required: "يحتاج مراجعة",
  rejected: "مرفوض",
};

export const paymentStatusLabels: Record<string, string> = {
  pending: "مستحق",
  paid: "مدفوع",
  overdue: "متأخر",
  cancelled: "ملغي",
};

export const boqCategoryLabels: Record<string, string> = {
  demolition: "هدم",
  masonry: "بناء",
  plumbing: "سباكة",
  electrical: "كهرباء",
  hvac: "تكييف",
  ceiling: "أسقف",
  flooring: "أرضيات",
  painting: "دهانات",
  carpentry: "نجارة",
  aluminum_glass: "ألوميتال وزجاج",
  furniture: "أثاث",
  kitchen: "مطبخ",
  bathroom: "حمام",
  accessories: "إكسسوارات",
  other: "أخرى",
};

export const boqUnitLabels: Record<string, string> = {
  m2: "م²",
  linear_meter: "م.ط",
  piece: "قطعة",
  set: "طقم",
  day: "يوم",
  lump_sum: "إجمالي",
};
