import { db } from "@workspace/db";
import {
  approvalsTable,
  boqItemsTable,
  clientsTable,
  commentsTable,
  fileAssetsTable,
  paymentsTable,
  projectStagesTable,
  projectsTable,
  quotationsTable,
  sessionsTable,
  usersTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { DEFAULT_STAGES } from "./lib/stages";
import { logger } from "./lib/logger";

async function main() {
  logger.info("Wiping existing data...");
  await db.delete(sessionsTable);
  await db.delete(commentsTable);
  await db.delete(approvalsTable);
  await db.delete(fileAssetsTable);
  await db.delete(boqItemsTable);
  await db.delete(paymentsTable);
  await db.delete(quotationsTable);
  await db.delete(projectStagesTable);
  await db.delete(projectsTable);
  await db.delete(usersTable);
  await db.delete(clientsTable);

  const passwordHash = await bcrypt.hash("password123", 10);

  logger.info("Seeding clients...");
  const clients = await db
    .insert(clientsTable)
    .values([
      {
        name: "أحمد محمد المصري",
        phone: "+201001234567",
        email: "ahmed.client@example.com",
        address: "التجمع الخامس، القاهرة الجديدة",
        source: "إحالة",
        notes: "عميل ذو أولوية، اهتمام عالي بالتفاصيل",
      },
      {
        name: "د. سارة عبد الرحمن",
        phone: "+201112345678",
        email: "sara.client@example.com",
        address: "الشيخ زايد، الجيزة",
        source: "موقع إلكتروني",
        notes: "طبيبة، تفضل التواصل في المساء",
      },
      {
        name: "شركة المعادي للاستثمار",
        phone: "+202234567890",
        email: "contact@maadi-invest.com",
        address: "المعادي، القاهرة",
        source: "علاقات عامة",
        notes: "شركة متعددة المشاريع",
      },
    ])
    .returning();

  logger.info("Seeding users...");
  const users = await db
    .insert(usersTable)
    .values([
      { name: "مدير النظام", email: "admin@emara.com", passwordHash, role: "admin" },
      { name: "خالد المبيعات", email: "sales@emara.com", passwordHash, role: "sales" },
      { name: "م. ليلى المصممة", email: "designer@emara.com", passwordHash, role: "designer" },
      { name: "م. عمر الرسام", email: "draftsman@emara.com", passwordHash, role: "draftsman" },
      { name: "م. ياسر حصر الكميات", email: "qs@emara.com", passwordHash, role: "qs" },
      { name: "أ. منى المحاسبة", email: "accountant@emara.com", passwordHash, role: "accountant" },
      {
        name: clients[0].name,
        email: clients[0].email!,
        passwordHash,
        role: "client",
        clientId: clients[0].id,
      },
    ])
    .returning();
  const designer = users.find((u) => u.role === "designer")!;
  const draftsman = users.find((u) => u.role === "draftsman")!;
  const qs = users.find((u) => u.role === "qs")!;
  const sales = users.find((u) => u.role === "sales")!;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  logger.info("Seeding projects...");
  const projects = await db
    .insert(projectsTable)
    .values([
      {
        clientId: clients[0].id,
        projectName: "فيلا التجمع الخامس",
        projectType: "villa",
        location: "التجمع الخامس، القاهرة الجديدة",
        areaSqm: 450,
        designStyle: "neoclassical",
        scopeType: "design_supervision",
        budget: 4500000,
        status: "design_3d",
        startDate: new Date(now - 60 * day),
        expectedEndDate: new Date(now + 90 * day),
        notes: "فيلا دورين بحديقة، تصميم نيوكلاسيك مع لمسات معاصرة",
      },
      {
        clientId: clients[1].id,
        projectName: "شقة الشيخ زايد",
        projectType: "apartment",
        location: "كمبوند بالم هيلز، الشيخ زايد",
        areaSqm: 220,
        designStyle: "modern",
        scopeType: "design_only",
        budget: 1200000,
        status: "client_review",
        startDate: new Date(now - 30 * day),
        expectedEndDate: new Date(now + 45 * day),
        notes: "شقة عائلية ٣ غرف، تصميم مودرن بألوان دافئة",
      },
      {
        clientId: clients[2].id,
        projectName: "عيادة المعادي الطبية",
        projectType: "clinic",
        location: "المعادي، القاهرة",
        areaSqm: 320,
        designStyle: "minimal",
        scopeType: "turnkey",
        budget: 2800000,
        status: "shop_drawings",
        startDate: new Date(now - 90 * day),
        expectedEndDate: new Date(now + 30 * day),
        notes: "عيادة متعددة التخصصات، تركيز على الراحة والوظيفية",
      },
    ])
    .returning();

  logger.info("Seeding stages...");
  for (const project of projects) {
    const stagesValues = DEFAULT_STAGES.map((s, i) => {
      let status: string = "not_started";
      const startDate: Date | null = new Date(now - (60 - i * 5) * day);
      let dueDate: Date | null = new Date(now + (i * 7 - 14) * day);
      let completedAt: Date | null = null;
      if (project.projectName.includes("فيلا")) {
        if (i < 4) {
          status = i < 3 ? "approved" : "in_progress";
          completedAt = i < 3 ? new Date(now - (40 - i * 5) * day) : null;
        }
      } else if (project.projectName.includes("شقة")) {
        if (i < 5) {
          status = i < 4 ? "approved" : "waiting_client_approval";
          completedAt = i < 4 ? new Date(now - (30 - i * 5) * day) : null;
        }
      } else {
        if (i < 6) {
          status = i < 5 ? "approved" : "in_progress";
          completedAt = i < 5 ? new Date(now - (60 - i * 7) * day) : null;
        }
      }
      // Make one stage overdue per project
      if (i === 1 && project.projectName.includes("شقة")) {
        dueDate = new Date(now - 5 * day);
        status = "in_progress";
        completedAt = null;
      }
      return {
        projectId: project.id,
        stageName: s.name,
        stageKey: s.key,
        order: s.order,
        status,
        assignedToId: i % 3 === 0 ? designer.id : i % 3 === 1 ? draftsman.id : qs.id,
        startDate,
        dueDate,
        completedAt,
        requiresClientApproval: s.requiresClientApproval,
      };
    });
    await db.insert(projectStagesTable).values(stagesValues);
  }

  logger.info("Seeding quotations...");
  const quotationData = [
    {
      projectId: projects[0].id,
      areaSqm: 450,
      pricePerSqm: 2500,
      shopDrawingPrice: 150000,
      supervisionPrice: 200000,
      discount: 50000,
      tax: 76250,
      status: "approved",
    },
    {
      projectId: projects[1].id,
      areaSqm: 220,
      pricePerSqm: 1800,
      shopDrawingPrice: 0,
      supervisionPrice: 0,
      discount: 0,
      tax: 22176,
      status: "sent",
    },
    {
      projectId: projects[2].id,
      areaSqm: 320,
      pricePerSqm: 2200,
      shopDrawingPrice: 100000,
      supervisionPrice: 180000,
      discount: 30000,
      tax: 67760,
      status: "approved",
    },
  ];
  for (const q of quotationData) {
    const designSubtotal = q.areaSqm * q.pricePerSqm;
    const finalTotal =
      designSubtotal + q.shopDrawingPrice + q.supervisionPrice - q.discount + q.tax;
    await db.insert(quotationsTable).values({
      ...q,
      designSubtotal,
      finalTotal,
    });
  }

  logger.info("Seeding payments...");
  await db.insert(paymentsTable).values([
    {
      projectId: projects[0].id,
      title: "دفعة أولى - تعاقد",
      amount: 500000,
      paymentType: "design_deposit",
      status: "paid",
      dueDate: new Date(now - 55 * day),
      paidDate: new Date(now - 53 * day),
    },
    {
      projectId: projects[0].id,
      title: "دفعة ٢ - اعتماد المخططات",
      amount: 400000,
      paymentType: "approval_2d",
      status: "paid",
      dueDate: new Date(now - 30 * day),
      paidDate: new Date(now - 28 * day),
    },
    {
      projectId: projects[0].id,
      title: "دفعة ٣ - اعتماد التصميم ثلاثي الأبعاد",
      amount: 300000,
      paymentType: "approval_3d",
      status: "pending",
      dueDate: new Date(now + 14 * day),
    },
    {
      projectId: projects[1].id,
      title: "دفعة أولى - تعاقد",
      amount: 200000,
      paymentType: "design_deposit",
      status: "paid",
      dueDate: new Date(now - 25 * day),
      paidDate: new Date(now - 24 * day),
    },
    {
      projectId: projects[1].id,
      title: "دفعة نهائية",
      amount: 196000,
      paymentType: "final",
      status: "pending",
      dueDate: new Date(now + 30 * day),
    },
    {
      projectId: projects[2].id,
      title: "دفعة أولى - تعاقد",
      amount: 600000,
      paymentType: "design_deposit",
      status: "paid",
      dueDate: new Date(now - 85 * day),
      paidDate: new Date(now - 82 * day),
    },
    {
      projectId: projects[2].id,
      title: "دفعة ٢ - رسومات تنفيذية",
      amount: 400000,
      paymentType: "shop_drawing",
      status: "pending",
      dueDate: new Date(now + 7 * day),
    },
    {
      projectId: projects[2].id,
      title: "دفعة التنفيذ",
      amount: 1200000,
      paymentType: "execution",
      status: "pending",
      dueDate: new Date(now - 3 * day),
    },
  ]);

  logger.info("Seeding BOQ items...");
  await db.insert(boqItemsTable).values([
    {
      projectId: projects[2].id,
      category: "demolition",
      itemName: "هدم وإزالة قواطع داخلية",
      description: "هدم القواطع الداخلية القديمة وترحيل المخلفات",
      unit: "m2",
      quantity: 80,
      unitPrice: 250,
      totalPrice: 80 * 250,
      executionStage: "أعمال هدم",
    },
    {
      projectId: projects[2].id,
      category: "flooring",
      itemName: "أرضيات بورسلين رمادي",
      description: "بورسلين إيطالي مقاس 60×120 سم درجة أولى",
      unit: "m2",
      quantity: 320,
      unitPrice: 950,
      totalPrice: 320 * 950,
      supplierName: "Italian Tiles Co.",
      executionStage: "تشطيبات",
    },
    {
      projectId: projects[2].id,
      category: "electrical",
      itemName: "نقاط إنارة LED",
      description: "تركيب نقاط إنارة سقفية LED مدمجة",
      unit: "piece",
      quantity: 65,
      unitPrice: 850,
      totalPrice: 65 * 850,
      executionStage: "كهرباء",
    },
    {
      projectId: projects[2].id,
      category: "carpentry",
      itemName: "كاونتر استقبال",
      description: "كاونتر استقبال خشب MDF مع واجهة كورين",
      unit: "lump_sum",
      quantity: 1,
      unitPrice: 65000,
      totalPrice: 65000,
      executionStage: "نجارة",
    },
    {
      projectId: projects[0].id,
      category: "kitchen",
      itemName: "مطبخ كلاسيكي خشب زان",
      description: "مطبخ بطول ٦ متر طولي، خشب زان، رخام كرارا",
      unit: "linear_meter",
      quantity: 6,
      unitPrice: 18000,
      totalPrice: 6 * 18000,
      executionStage: "نجارة",
    },
  ]);

  logger.info("Seeding files...");
  await db.insert(fileAssetsTable).values([
    {
      projectId: projects[0].id,
      uploadedById: designer.id,
      fileName: "عقد التصميم - فيلا التجمع.pdf",
      fileUrl: "https://example.com/files/contract-villa.pdf",
      fileType: "application/pdf",
      category: "contract",
      version: 1,
      isPublic: true,
      notes: "العقد الموقع نسخة أصلية",
    },
    {
      projectId: projects[0].id,
      uploadedById: designer.id,
      fileName: "مخططات الدور الأرضي.pdf",
      fileUrl: "https://example.com/files/villa-ground-floor.pdf",
      fileType: "application/pdf",
      category: "plan_2d",
      version: 2,
      isPublic: true,
    },
    {
      projectId: projects[0].id,
      uploadedById: designer.id,
      fileName: "موود بورد الصالة.jpg",
      fileUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
      fileType: "image/jpeg",
      category: "mood_board",
      version: 1,
      isPublic: true,
    },
    {
      projectId: projects[1].id,
      uploadedById: designer.id,
      fileName: "تصور أولي - شقة الشيخ زايد.jpg",
      fileUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
      fileType: "image/jpeg",
      category: "render_3d",
      version: 1,
      isPublic: true,
    },
    {
      projectId: projects[2].id,
      uploadedById: draftsman.id,
      fileName: "رسومات تنفيذية - عيادة المعادي.dwg",
      fileUrl: "https://example.com/files/clinic-shop-drawings.dwg",
      fileType: "application/acad",
      category: "shop_drawing",
      version: 3,
      isPublic: false,
      notes: "نسخة داخلية للمراجعة",
    },
  ]);

  logger.info("Seeding approvals & comments...");
  // Find a stage to attach approval to
  const villaStages = await db
    .select()
    .from(projectStagesTable)
    .where(eq(projectStagesTable.projectId, projects[0].id));
  const villa3d = villaStages.find((s) => s.stageKey === "design_3d")!;
  const apartmentStages = await db
    .select()
    .from(projectStagesTable)
    .where(eq(projectStagesTable.projectId, projects[1].id));
  const apartmentReview = apartmentStages.find((s) => s.stageKey === "client_review")!;

  await db.insert(approvalsTable).values([
    {
      projectId: projects[0].id,
      stageId: villa3d.id,
      requestedById: designer.id,
      status: "pending",
      internalComment: "في انتظار رد العميل على التصميمات النهائية للصالة الرئيسية",
      requestedAt: new Date(now - 3 * day),
    },
    {
      projectId: projects[1].id,
      stageId: apartmentReview.id,
      requestedById: designer.id,
      status: "pending",
      internalComment: "اعتماد التصاميم النهائية للشقة قبل التسليم",
      requestedAt: new Date(now - 2 * day),
    },
  ]);

  await db.insert(commentsTable).values([
    {
      projectId: projects[0].id,
      stageId: villa3d.id,
      userId: designer.id,
      commentText: "تم إعداد ٣ بدائل لتصميم الصالة الرئيسية، في انتظار اختيار العميل.",
      isInternal: false,
    },
    {
      projectId: projects[0].id,
      userId: sales.id,
      commentText: "تذكير: العميل طلب موعد لزيارة معرض الإضاءة الأسبوع القادم.",
      isInternal: true,
    },
    {
      projectId: projects[2].id,
      userId: qs.id,
      commentText: "تم تحديث جدول الكميات بأسعار السوق الحالية. الفرق +٣% عن العرض المبدئي.",
      isInternal: true,
    },
  ]);

  logger.info("Seed complete!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "Seed failed");
    process.exit(1);
  });
