export type StageDefinition = {
  key: string;
  name: string;
  order: number;
  requiresClientApproval: boolean;
};

export const DEFAULT_STAGES: StageDefinition[] = [
  { key: "site_survey", name: "معاينة الموقع", order: 1, requiresClientApproval: false },
  { key: "planning_2d", name: "المخططات الثنائية الأبعاد", order: 2, requiresClientApproval: true },
  { key: "mood_board", name: "لوحة الإلهام", order: 3, requiresClientApproval: true },
  { key: "design_3d", name: "التصميم الثلاثي الأبعاد", order: 4, requiresClientApproval: true },
  { key: "client_review", name: "مراجعة العميل النهائية", order: 5, requiresClientApproval: true },
  { key: "shop_drawings", name: "رسومات التنفيذ", order: 6, requiresClientApproval: false },
  { key: "boq", name: "جدول الكميات والأسعار", order: 7, requiresClientApproval: false },
  { key: "execution_ready", name: "جاهز للتنفيذ", order: 8, requiresClientApproval: false },
  { key: "execution", name: "التنفيذ", order: 9, requiresClientApproval: false },
  { key: "handover", name: "التسليم النهائي", order: 10, requiresClientApproval: true },
];
