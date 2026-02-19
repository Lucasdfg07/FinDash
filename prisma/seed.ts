import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ========================
  // USUÁRIO ADMIN
  // ========================
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@findash.com" },
    update: {},
    create: {
      email: "admin@findash.com",
      password: hashedPassword,
      name: "Lucas",
    },
  });
  console.log("✅ User created:", user.email);

  // ========================
  // CATEGORIAS
  // ========================
  const categories = [
    { name: "Funcionários", color: "#6366f1", icon: "users", type: "expense" },
    { name: "Ferramentas e Software", color: "#8b5cf6", icon: "wrench", type: "expense" },
    { name: "Ads - Meta (Facebook)", color: "#3b82f6", icon: "megaphone", type: "expense" },
    { name: "Ads - Google", color: "#ef4444", icon: "search", type: "expense" },
    { name: "Impostos e Taxas", color: "#f59e0b", icon: "receipt", type: "expense" },
    { name: "Pagamento Cartão", color: "#ec4899", icon: "credit-card", type: "expense" },
    { name: "Investimentos", color: "#10b981", icon: "trending-up", type: "expense" },
    { name: "Outros Gastos", color: "#64748b", icon: "circle-dot", type: "expense" },
    { name: "Receita - Launch Pad", color: "#22c55e", icon: "dollar-sign", type: "income" },
    { name: "Receita - Outros", color: "#84cc16", icon: "coins", type: "income" },
    { name: "IOF e Encargos", color: "#f97316", icon: "percent", type: "expense" },
    { name: "Hospedagem e Domínios", color: "#06b6d4", icon: "globe", type: "expense" },
    { name: "Educação", color: "#a855f7", icon: "book-open", type: "expense" },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categoryMap[cat.name] = created.id;
  }
  console.log("✅ Categories created:", Object.keys(categoryMap).length);

  // ========================
  // CUSTOS FIXOS
  // ========================
  const fixedCosts = [
    { name: "BotConversa", amount: 97.0, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "monthly" },
    { name: "UTMIFY - Dash", amount: 99.90, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "monthly" },
    { name: "Gustavo Editor", amount: 2300.0, categoryId: categoryMap["Funcionários"], subcategory: "Funcionários", recurrence: "monthly" },
    { name: "Pedro Suporte", amount: 1700.0, categoryId: categoryMap["Funcionários"], subcategory: "Funcionários", recurrence: "monthly" },
    { name: "Sheile Comercial", amount: 2500.0, categoryId: categoryMap["Funcionários"], subcategory: "Funcionários", recurrence: "monthly" },
    { name: "Panda Videos", amount: 190.0, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "monthly" },
    { name: "Manychat Mensalidade", amount: 90.0, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "monthly" },
    { name: "Google Workspace", amount: 197.0, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "monthly" },
    { name: "Devzapp", amount: 147.0, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "monthly" },
    { name: "Créditos OpenAI + Perplexity", amount: 50.0, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "monthly" },
    { name: "Cademi", amount: 997.0, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "monthly" },
    { name: "E-NOTAS", amount: 219.0, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "annual", renewalDate: "Jan", notes: "Renovação anual em Janeiro" },
    { name: "StreamYard", amount: 130.0, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "annual", renewalDate: "Set", notes: "Renovação anual em Setembro" },
    { name: "Hostinger VPS", amount: 39.99, categoryId: categoryMap["Hospedagem e Domínios"], subcategory: "Ferramentas e Software", recurrence: "annual", renewalDate: "Set", notes: "Renovação anual em Setembro" },
    { name: "Opus Clip", amount: 110.0, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "monthly" },
    { name: "SendPulse Email Marketing", amount: 600.0, categoryId: categoryMap["Ferramentas e Software"], subcategory: "Ferramentas e Software", recurrence: "monthly" },
  ];

  for (const cost of fixedCosts) {
    await prisma.fixedCost.create({ data: cost });
  }
  console.log("✅ Fixed costs created:", fixedCosts.length);

  // ========================
  // TRANSAÇÕES BANCÁRIAS (EXTRATO)
  // ========================
  const bankTransactions = [
    { date: "2025-11-21", description: "SIMPLES NACIONAL", amount: -80.51, balance: 16749.88, type: "tax", categoryId: categoryMap["Impostos e Taxas"] },
    { date: "2025-11-21", description: "Pix enviado: Lais Regina Wathier", amount: -2662.56, balance: 14087.32, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Lais Regina Wathier" },
    { date: "2025-11-22", description: "Pix enviado: GABRIEL PEREIRA DA SILVA", amount: -825.00, balance: 13262.32, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Gabriel Pereira da Silva" },
    { date: "2025-11-23", description: "Pix enviado: Madeira Videos LTDA", amount: -1750.00, balance: 11512.32, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Madeira Videos LTDA" },
    { date: "2025-11-27", description: "Pix enviado: DEMERGE BRASIL", amount: -54.99, balance: 11457.33, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Demerge Brasil" },
    { date: "2025-11-28", description: "Pix enviado: Fabricando Moldura SP", amount: -824.50, balance: 10632.83, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Fabricando Moldura SP" },
    { date: "2025-11-28", description: "Pix enviado: Guilherme Santos Chaves Rocha", amount: -746.44, balance: 9886.39, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Guilherme Santos Chaves Rocha" },
    { date: "2025-11-30", description: "Pix enviado: Reproduzindo Talentos Marketing LTDA", amount: -4100.00, balance: 5786.39, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Reproduzindo Talentos Marketing LTDA" },
    { date: "2025-12-01", description: "Débito automático", amount: -18.62, balance: 5767.77, type: "other", categoryId: categoryMap["Outros Gastos"] },
    { date: "2025-12-01", description: "Débito automático", amount: -2.80, balance: 5764.97, type: "other", categoryId: categoryMap["Outros Gastos"] },
    { date: "2025-12-01", description: "Débito automático", amount: -113.99, balance: 5650.98, type: "other", categoryId: categoryMap["Outros Gastos"] },
    { date: "2025-12-03", description: "Pix enviado: SETH COMERCIO", amount: -1850.55, balance: 3800.43, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Seth Comercio" },
    { date: "2025-12-04", description: "Pix recebido: LAUNCH PAD SOCIEDADE DE CREDITO DIRETO S A", amount: 75808.00, balance: 79608.43, type: "pix_received", categoryId: categoryMap["Receita - Launch Pad"], recipient: "Launch Pad" },
    { date: "2025-12-04", description: "Pix recebido: DAVISON PEREIRA GUERRA", amount: 35.00, balance: 79643.43, type: "pix_received", categoryId: categoryMap["Receita - Outros"], recipient: "Davison Pereira Guerra" },
    { date: "2025-12-05", description: "Pix enviado: Sheile Cristina Pereira Freire", amount: -2550.00, balance: 77093.43, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Sheile Cristina Pereira Freire" },
    { date: "2025-12-05", description: "Pix enviado: GABRIEL PEREIRA DA SILVA", amount: -750.00, balance: 76343.43, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Gabriel Pereira da Silva" },
    { date: "2025-12-05", description: "Pagamento fatura cartão Inter", amount: -10402.36, balance: 65941.07, type: "payment", categoryId: categoryMap["Pagamento Cartão"] },
    { date: "2025-12-05", description: "Pix enviado: Lais Regina Wathier", amount: -2377.92, balance: 63563.15, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Lais Regina Wathier" },
    { date: "2025-12-09", description: "Pix recebido: LAUNCH PAD SOCIEDADE DE CREDITO DIRETO S A", amount: 14500.00, balance: 78063.15, type: "pix_received", categoryId: categoryMap["Receita - Launch Pad"], recipient: "Launch Pad" },
    { date: "2025-12-10", description: "Pix enviado: Pedro Pelicioni Costa", amount: -1700.00, balance: 76363.15, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Pedro Pelicioni Costa" },
    { date: "2025-12-15", description: "Pix enviado: Fabricardecor LTDA", amount: -97.28, balance: 76265.87, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Fabricardecor LTDA" },
    { date: "2025-12-17", description: "Pix enviado: ANABELA MARTINS DOS SANTOS", amount: -2000.00, balance: 74265.87, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Anabela Martins dos Santos" },
    { date: "2025-12-17", description: "Pix enviado: Sheile Cristina Pereira Freire", amount: -116.00, balance: 74149.87, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Sheile Cristina Pereira Freire" },
    { date: "2025-12-18", description: "Pix recebido: Lucas Martini", amount: 250.00, balance: 74399.87, type: "pix_received", categoryId: categoryMap["Receita - Outros"], recipient: "Lucas Martini" },
    { date: "2025-12-18", description: "Pix enviado: Gabriel Fonseca Silva", amount: -1205.63, balance: 73194.24, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Gabriel Fonseca Silva" },
    { date: "2025-12-19", description: "Pix recebido: LAUNCH PAD SOCIEDADE DE CREDITO DIRETO S A", amount: 26595.13, balance: 99789.37, type: "pix_received", categoryId: categoryMap["Receita - Launch Pad"], recipient: "Launch Pad" },
    { date: "2025-12-20", description: "Pix enviado: Gustavo Pessanha de Souza", amount: -2300.00, balance: 97489.37, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Gustavo Pessanha de Souza" },
    { date: "2025-12-22", description: "Pix enviado: SETH COMERCIO", amount: -571.25, balance: 96918.12, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Seth Comercio" },
    { date: "2025-12-22", description: "Pix enviado: Lucas Siqueira Fernandes", amount: -18000.00, balance: 78918.12, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Lucas Siqueira Fernandes" },
    { date: "2025-12-22", description: "Pix enviado: GABRIEL PEREIRA DA SILVA", amount: -825.00, balance: 78093.12, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Gabriel Pereira da Silva" },
    { date: "2025-12-22", description: "Pagamento: REPRODUZINDO TALENTOS", amount: -2323.34, balance: 75769.78, type: "payment", categoryId: categoryMap["Outros Gastos"], recipient: "Reproduzindo Talentos" },
    { date: "2025-12-30", description: "Pagamento fatura cartão Inter", amount: -11385.68, balance: 64384.10, type: "payment", categoryId: categoryMap["Pagamento Cartão"] },
    { date: "2026-01-04", description: "Pagamento fatura cartão Inter", amount: -2651.17, balance: 61732.93, type: "payment", categoryId: categoryMap["Pagamento Cartão"] },
    { date: "2026-01-05", description: "Pix recebido: LAUNCH PAD SOCIEDADE DE CREDITO DIRETO S A", amount: 17638.29, balance: 79371.22, type: "pix_received", categoryId: categoryMap["Receita - Launch Pad"], recipient: "Launch Pad" },
    { date: "2026-01-05", description: "Pix enviado: Lais Regina Wathier", amount: -907.35, balance: 78463.87, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Lais Regina Wathier" },
    { date: "2026-01-05", description: "Pix enviado: Pedro Pelicioni Costa", amount: -1800.00, balance: 76663.87, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Pedro Pelicioni Costa" },
    { date: "2026-01-05", description: "Pix enviado: Sheile Cristina Pereira Freire", amount: -2500.00, balance: 74163.87, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Sheile Cristina Pereira Freire" },
    { date: "2026-01-05", description: "Pix enviado: Gustavo Pessanha de Souza", amount: -2300.00, balance: 71863.87, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Gustavo Pessanha de Souza" },
    { date: "2026-01-05", description: "Pix enviado: GABRIEL PEREIRA DA SILVA", amount: -750.00, balance: 71113.87, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Gabriel Pereira da Silva" },
    { date: "2026-01-14", description: "Pix enviado: Sheile Cristina Pereira Freire", amount: -19.94, balance: 71093.93, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Sheile Cristina Pereira Freire" },
    { date: "2026-01-14", description: "Pagamento fatura cartão Inter", amount: -10101.76, balance: 60992.17, type: "payment", categoryId: categoryMap["Pagamento Cartão"] },
    { date: "2026-01-19", description: "Pagamento fatura cartão Inter", amount: -3614.84, balance: 57377.33, type: "payment", categoryId: categoryMap["Pagamento Cartão"] },
    { date: "2026-01-20", description: "Pix recebido: LAUNCH PAD SOCIEDADE DE CREDITO DIRETO S A", amount: 22962.19, balance: 80339.52, type: "pix_received", categoryId: categoryMap["Receita - Launch Pad"], recipient: "Launch Pad" },
    { date: "2026-01-22", description: "Pagamento fatura cartão Inter", amount: -7430.52, balance: 72909.00, type: "payment", categoryId: categoryMap["Pagamento Cartão"] },
    { date: "2026-01-24", description: "Pix enviado: ANABELA MARTINS DOS SANTOS", amount: -2000.00, balance: 70909.00, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Anabela Martins dos Santos" },
    { date: "2026-01-26", description: "Aplicação: CDB CREDITO BANCO INTER S A", amount: -10000.00, balance: 60909.00, type: "application", categoryId: categoryMap["Investimentos"] },
    { date: "2026-01-26", description: "Pagamento fatura cartão Inter", amount: -7430.84, balance: 53478.16, type: "payment", categoryId: categoryMap["Pagamento Cartão"] },
    { date: "2026-01-30", description: "Pagamento fatura cartão Inter", amount: -7364.23, balance: 46113.93, type: "payment", categoryId: categoryMap["Pagamento Cartão"] },
    { date: "2026-02-02", description: "Pix enviado: Gustavo Comin", amount: -9000.00, balance: 37113.93, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Gustavo Comin" },
    { date: "2026-02-02", description: "Pix enviado: Lucas Siqueira Fernandes", amount: -9000.00, balance: 28113.93, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Lucas Siqueira Fernandes" },
    { date: "2026-02-03", description: "Pix recebido: LAUNCH PAD SOCIEDADE DE CREDITO DIRETO S A", amount: 14341.15, balance: 42455.08, type: "pix_received", categoryId: categoryMap["Receita - Launch Pad"], recipient: "Launch Pad" },
    { date: "2026-02-05", description: "Pix enviado: Fabricando Moldura SP", amount: -649.50, balance: 41805.58, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Fabricando Moldura SP" },
    { date: "2026-02-05", description: "Pix enviado: EBANX", amount: -121.08, balance: 41684.50, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "EBANX" },
    { date: "2026-02-05", description: "Pix enviado: Pagar Me Pagamentos", amount: -197.00, balance: 41487.50, type: "pix_sent", categoryId: categoryMap["Outros Gastos"], recipient: "Pagar.me" },
    { date: "2026-02-05", description: "Pagamento fatura cartão Inter", amount: -3406.30, balance: 38081.20, type: "payment", categoryId: categoryMap["Pagamento Cartão"] },
    { date: "2026-02-05", description: "Pix enviado: Lais Regina Wathier", amount: -692.34, balance: 37388.86, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Lais Regina Wathier" },
    { date: "2026-02-05", description: "Pix enviado: Sheile Cristina Pereira Freire", amount: -2500.00, balance: 34888.86, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Sheile Cristina Pereira Freire" },
    { date: "2026-02-05", description: "Pix enviado: Gustavo Pessanha de Souza", amount: -2300.00, balance: 32588.86, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Gustavo Pessanha de Souza" },
    { date: "2026-02-05", description: "Pix enviado: Pedro Pelicioni Costa", amount: -1800.00, balance: 30788.86, type: "pix_sent", categoryId: categoryMap["Funcionários"], recipient: "Pedro Pelicioni Costa" },
    { date: "2026-02-13", description: "Pagamento: EBANX CRED INST PAG LTDA", amount: -2297.00, balance: 28491.86, type: "payment", categoryId: categoryMap["Outros Gastos"], recipient: "EBANX" },
    { date: "2026-02-18", description: "Pix recebido: LAUNCH PAD SOCIEDADE DE CREDITO DIRETO S A", amount: 30295.29, balance: 58787.15, type: "pix_received", categoryId: categoryMap["Receita - Launch Pad"], recipient: "Launch Pad" },
    { date: "2026-02-18", description: "Aplicação: CDB OBJ PJ BANCO INTER SA", amount: -280.00, balance: 58507.15, type: "application", categoryId: categoryMap["Investimentos"] },
    { date: "2026-02-18", description: "Cred Pontos Meu Porquinho: Resgate Pontos", amount: 280.00, balance: 58787.15, type: "other", categoryId: categoryMap["Receita - Outros"] },
  ];

  for (const tx of bankTransactions) {
    await prisma.transaction.create({
      data: {
        ...tx,
        date: new Date(tx.date),
      },
    });
  }
  console.log("✅ Bank transactions created:", bankTransactions.length);

  // ========================
  // TRANSAÇÕES CARTÃO - Fatura Vencimento 10/12 (Nov 2025)
  // ========================
  const cardTransactions_dec = [
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "ADOBE", amount: -114.00, card: "1298", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-03", description: "MANYCHAT COM", amount: -56.18, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-04", description: "CLIPFY SOFTWARE", amount: -197.00, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-04", description: "MANYCHAT COM", amount: -56.53, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-04", description: "MANYCHAT COM", amount: -56.53, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-04", description: "MANYCHAT COM", amount: -56.53, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-04", description: "MANYCHAT COM", amount: -56.53, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-04", description: "MANYCHAT COM", amount: -56.53, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-04", description: "MANYCHAT COM", amount: -56.53, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-04", description: "MANYCHAT COM", amount: -56.53, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-04", description: "MANYCHAT COM", amount: -56.53, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-04", description: "MANYCHAT COM", amount: -56.53, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-04", description: "MANYCHAT COM", amount: -56.53, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-10", description: "MANYCHAT COM", amount: -55.84, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-10", description: "ASAAS DEVZAPP LTDA", amount: -147.00, card: "1298", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-10", description: "MANYCHAT COM", amount: -55.84, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-10", description: "MANYCHAT COM", amount: -55.84, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-10", description: "MANYCHAT COM", amount: -55.84, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-10", description: "MANYCHAT COM", amount: -55.84, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-11", description: "MANYCHAT COM", amount: -55.36, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-11", description: "MANYCHAT COM", amount: -55.36, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-11", description: "MANYCHAT COM", amount: -55.36, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-11", description: "MANYCHAT COM", amount: -55.36, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-13", description: "FACEBK (Meta Ads)", amount: -4474.40, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-14", description: "TYPEFORM S L", amount: -161.22, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-16", description: "CLAUDE AI SUBSCRIPTION", amount: -110.00, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-17", description: "FACEBK (Meta Ads)", amount: -14.99, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-17", description: "FACEBK (Meta Ads)", amount: -17.54, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-17", description: "FACEBK (Meta Ads)", amount: -20.20, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-17", description: "FACEBK (Meta Ads)", amount: -11.12, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-18", description: "FACEBK (Meta Ads)", amount: -33.90, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-18", description: "FACEBK (Meta Ads)", amount: -21.02, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-19", description: "FACEBK (Meta Ads)", amount: -47.11, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-20", description: "FACEBK (Meta Ads)", amount: -47.32, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-20", description: "FACEBK (Meta Ads)", amount: -47.40, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-21", description: "FACEBK (Meta Ads)", amount: -139.05, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-21", description: "LINKUPAPI COM", amount: -162.42, card: "1298", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-22", description: "FACEBK (Meta Ads)", amount: -139.49, card: "1298", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-22", description: "PANDA VIDEO", amount: -187.90, card: "1298", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-11-27", description: "EC BOTCONVERS (Parcela 1/12)", amount: -97.00, card: "3629", cardCategory: "SERVICOS", type: "Parcela 1/12", invoiceMonth: "2025-12" },
    { date: "2025-11-29", description: "CADEMI", amount: -997.00, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-12-01", description: "Google Workspace", amount: -196.00, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-12-01", description: "Google ADS", amount: -972.35, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2025-12" },
    { date: "2025-12-02", description: "LOVABLE", amount: -139.71, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2025-12" },
  ];

  // Fatura Vencimento 10/01 (Dez 2025)
  const cardTransactions_jan = [
    { date: "2025-12-04", description: "FACEBK (Meta Ads)", amount: -836.77, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-08", description: "UTMIFY TECNOLOGIA", amount: -89.91, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-08", description: "OPUS CLIP", amount: -108.22, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-13", description: "MANYCHAT COM", amount: -7.03, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-13", description: "FACEBK (Meta Ads)", amount: -2317.55, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-15", description: "DM hostingercomb", amount: -64.99, card: "3629", cardCategory: "ENSINO", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-15", description: "ASAAS DEVZAPP LTDA", amount: -147.00, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-17", description: "CLAUDE AI SUBSCRIPTION", amount: -110.00, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-18", description: "SENDPULSE COM", amount: -599.00, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-22", description: "PANDA VIDEO", amount: -187.90, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-23", description: "DM hostingercomb", amount: -446.61, card: "3629", cardCategory: "ENSINO", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-24", description: "TYPEFORM S L", amount: -168.52, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-25", description: "FACEBK (Meta Ads)", amount: -5642.73, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-26", description: "GAMMA APP", amount: -40.00, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-26", description: "LOVABLE", amount: -279.42, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-27", description: "DM hostingercomb", amount: -89.99, card: "3629", cardCategory: "ENSINO", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-29", description: "CADEMI", amount: -997.00, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-30", description: "MANYCHAT COM", amount: -86.66, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-30", description: "FACEBK (Meta Ads)", amount: -115.26, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-12-31", description: "OPUS CLIP", amount: -109.76, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2026-01-01", description: "FACEBK (Meta Ads)", amount: -172.81, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2026-01-01", description: "Google Workspace", amount: -196.00, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2026-01-01", description: "FACEBK (Meta Ads)", amount: -12.24, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2026-01-01", description: "FACEBK (Meta Ads)", amount: -87.26, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2026-01-01", description: "Google ADS", amount: -867.31, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-01" },
    { date: "2025-11-27", description: "EC BOTCONVERS (Parcela 2/12)", amount: -97.00, card: "3629", cardCategory: "SERVICOS", type: "Parcela 2/12", invoiceMonth: "2026-01" },
    { date: "2025-10-28", description: "REV CR COMPRA INTERNAC", amount: -107.10, card: "1298", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-01" },
  ];

  // Fatura Vencimento 10/02 (Jan 2026)
  const cardTransactions_feb = [
    { date: "2026-01-03", description: "FACEBK (Meta Ads)", amount: -276.61, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-03", description: "FACEBK (Meta Ads)", amount: -111.39, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-02", description: "FACEBK (Meta Ads)", amount: -111.12, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-01", description: "FACEBK (Meta Ads)", amount: -105.32, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-04", description: "FACEBK (Meta Ads)", amount: -277.93, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-05", description: "FACEBK (Meta Ads)", amount: -352.27, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-06", description: "FACEBK (Meta Ads)", amount: -397.79, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-07", description: "FACEBK (Meta Ads)", amount: -528.05, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-07", description: "UTMIFY TECNOLOGIA", amount: -89.91, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-08", description: "FACEBK (Meta Ads)", amount: -3151.98, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-08", description: "FACEBK (Meta Ads)", amount: -2873.09, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-09", description: "FACEBK (Meta Ads)", amount: -527.06, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-11", description: "FACEBK (Meta Ads)", amount: -527.87, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-11", description: "FACEBK (Meta Ads)", amount: -527.37, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-12", description: "ASAAS DEVZAPP LTDA", amount: -147.00, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-13", description: "FACEBK (Meta Ads)", amount: -1828.57, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-13", description: "FACEBK (Meta Ads)", amount: -620.82, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-14", description: "TYPEFORM S L", amount: -190.05, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-16", description: "FACEBK (Meta Ads)", amount: -854.90, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-17", description: "CLAUDE AI SUBSCRIPTION", amount: -110.00, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-17", description: "FW THEPOSTPROTOCOL", amount: -134.19, card: "3629", cardCategory: "VESTUARIO", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-18", description: "FACEBK (Meta Ads)", amount: -6422.67, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-18", description: "SENDPULSE COM", amount: -599.00, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-19", description: "PADDLE NET WHATSBOT", amount: -71.15, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-20", description: "MANYCHAT COM", amount: -56.47, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-20", description: "MANYCHAT COM", amount: -56.47, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-20", description: "MANYCHAT COM", amount: -56.47, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-22", description: "FACEBK (Meta Ads)", amount: -6437.30, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-22", description: "PANDA VIDEO", amount: -187.90, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-22", description: "FACEBK (Meta Ads)", amount: -805.64, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-25", description: "FACEBK (Meta Ads)", amount: -508.17, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-25", description: "FACEBK (Meta Ads)", amount: -803.24, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-26", description: "GAMMA APP", amount: -40.00, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-26", description: "LOVABLE", amount: -279.42, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-27", description: "DM hostingercomb", amount: -89.99, card: "3629", cardCategory: "ENSINO", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-29", description: "CADEMI", amount: -997.00, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-30", description: "MANYCHAT COM", amount: -444.01, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-31", description: "OPUS CLIP", amount: -104.33, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-31", description: "FACEBK (Meta Ads)", amount: -855.38, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-02-01", description: "Google ADS", amount: -790.39, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-02-01", description: "Google Workspace", amount: -196.00, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-02" },
    { date: "2026-01-27", description: "EC BOTCONVERS (Parcela 3/12)", amount: -97.00, card: "3629", cardCategory: "SERVICOS", type: "Parcela 3/12", invoiceMonth: "2026-02" },
  ];

  // Fatura Vencimento 10/03 (Fev 2026)
  const cardTransactions_mar = [
    { date: "2026-02-04", description: "FACEBK (Meta Ads)", amount: -855.17, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-05", description: "MANYCHAT COM", amount: -55.20, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-05", description: "MANYCHAT COM", amount: -55.20, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-05", description: "MANYCHAT COM", amount: -55.20, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-05", description: "MANYCHAT COM", amount: -55.20, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-05", description: "MANYCHAT COM", amount: -55.20, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-07", description: "UTMIFY TECNOLOGIA", amount: -99.90, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-07", description: "FACEBK (Meta Ads)", amount: -855.27, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-10", description: "FACEBK (Meta Ads)", amount: -854.96, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-13", description: "FACEBK (Meta Ads)", amount: -5644.23, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-13", description: "FACEBK (Meta Ads)", amount: -483.13, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-14", description: "TYPEFORM S L", amount: -183.90, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-16", description: "ASAAS DEVZAPP LTDA", amount: -147.00, card: "3629", cardCategory: "OUTROS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-17", description: "FACEBK (Meta Ads)", amount: -855.08, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-17", description: "CLAUDE AI SUBSCRIPTION", amount: -110.00, card: "3629", cardCategory: "COMPRAS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-02-18", description: "SENDPULSE COM", amount: -599.00, card: "3629", cardCategory: "SERVICOS", type: "Compra à vista", invoiceMonth: "2026-03" },
    { date: "2026-11-27", description: "EC BOTCONVERS (Parcela 4/12)", amount: -97.00, card: "8676", cardCategory: "SERVICOS", type: "Parcela 4/12", invoiceMonth: "2026-03" },
  ];

  // Assign categories to card transactions based on description
  function assignCardCategory(description: string): string | null {
    const desc = description.toUpperCase();
    if (desc.includes("FACEBK") || desc.includes("META")) return categoryMap["Ads - Meta (Facebook)"];
    if (desc.includes("GOOGLE ADS")) return categoryMap["Ads - Google"];
    if (desc.includes("GOOGLE WORKSPACE")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("MANYCHAT")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("SENDPULSE")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("CADEMI")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("OPUS CLIP")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("TYPEFORM")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("PANDA VIDEO")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("BOTCONVERS")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("DEVZAPP") || desc.includes("ASAAS")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("UTMIFY")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("LOVABLE") || desc.includes("GAMMA")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("CLAUDE")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("ADOBE")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("CLIPFY")) return categoryMap["Ferramentas e Software"];
    if (desc.includes("HOSTINGER")) return categoryMap["Hospedagem e Domínios"];
    if (desc.includes("IOF") || desc.includes("ENCARGOS") || desc.includes("JUROS")) return categoryMap["IOF e Encargos"];
    if (desc.includes("PAGAMENTO ON LINE") || desc.includes("DEB AUT")) return null; // pagamentos
    return categoryMap["Outros Gastos"];
  }

  const allCardTx = [
    ...cardTransactions_dec,
    ...cardTransactions_jan,
    ...cardTransactions_feb,
    ...cardTransactions_mar,
  ];

  for (const tx of allCardTx) {
    await prisma.cardTransaction.create({
      data: {
        ...tx,
        date: new Date(tx.date),
        categoryId: assignCardCategory(tx.description),
      },
    });
  }
  console.log("✅ Card transactions created:", allCardTx.length);

  console.log("\n🎉 Seed completed!");
  console.log("📧 Login: admin@findash.com");
  console.log("🔑 Senha: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
