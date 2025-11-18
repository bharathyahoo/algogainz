import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions for transactions and holdings
type Transaction = {
  id: string;
  userId: string;
  stockSymbol: string;
  companyName: string;
  type: string;
  quantity: number;
  pricePerShare: number;
  grossAmount: number;
  brokerage: number;
  exchangeCharges: number;
  gst: number;
  sebiCharges: number;
  stampDuty: number;
  totalCharges: number;
  netAmount: number;
  source: string;
  orderIdRef: string | null;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
};

type Holding = {
  id: string;
  userId: string;
  stockSymbol: string;
  companyName: string;
  quantity: number;
  avgBuyPrice: number;
  totalInvested: number;
  currentPrice: number | null;
  currentValue: number | null;
  unrealizedPnL: number | null;
  unrealizedPnLPct: number | null;
  dayChange: number | null;
  dayChangePct: number | null;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
};

export interface ReportFilters {
  userId: string;
  startDate?: string;
  endDate?: string;
  type?: 'BUY' | 'SELL' | 'ALL';
  symbol?: string;
  source?: 'APP_EXECUTED' | 'MANUALLY_RECORDED' | 'ALL';
}

export interface StockPnL {
  stockSymbol: string;
  companyName: string;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  currentHolding: number;
  totalBuyValue: number;
  totalSellValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  avgBuyPrice: number;
  avgSellPrice: number;
}

/**
 * Calculate FIFO-based P&L for a specific stock
 */
function calculateFIFOPnL(buyTransactions: Transaction[], sellTransactions: Transaction[]): number {
  let totalPnL = 0;

  // Create a mutable copy with remainingQty property
  type BuyWithRemaining = Transaction & { remainingQty?: number };
  const buyQueue: BuyWithRemaining[] = [...buyTransactions].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const sell of sellTransactions) {
    let remainingQty = sell.quantity;

    while (remainingQty > 0 && buyQueue.length > 0) {
      const buy = buyQueue[0];

      if (!buy.remainingQty) {
        buy.remainingQty = buy.quantity;
      }

      const qtyToMatch = Math.min(remainingQty, buy.remainingQty);

      // Calculate P&L for this matched pair
      const buyCost = (buy.pricePerShare * qtyToMatch) +
                      (buy.totalCharges * qtyToMatch / buy.quantity);
      const sellProceeds = (sell.pricePerShare * qtyToMatch) -
                           (sell.totalCharges * qtyToMatch / sell.quantity);

      totalPnL += sellProceeds - buyCost;

      buy.remainingQty -= qtyToMatch;
      remainingQty -= qtyToMatch;

      if (buy.remainingQty <= 0) {
        buyQueue.shift();
      }
    }
  }

  return totalPnL;
}

/**
 * Calculate stock-wise P&L summary
 */
async function calculateStockWisePnL(transactions: Transaction[], holdings: Holding[]): Promise<StockPnL[]> {
  const stockMap = new Map<string, StockPnL>();

  // Group transactions by stock
  const stockGroups = new Map<string, { buys: Transaction[], sells: Transaction[] }>();

  for (const txn of transactions) {
    if (!stockGroups.has(txn.stockSymbol)) {
      stockGroups.set(txn.stockSymbol, { buys: [], sells: [] });
    }

    const group = stockGroups.get(txn.stockSymbol)!;
    if (txn.type === 'BUY') {
      group.buys.push(txn);
    } else {
      group.sells.push(txn);
    }
  }

  // Calculate P&L for each stock
  for (const [symbol, group] of stockGroups) {
    const { buys, sells } = group;

    const totalBuyQuantity = buys.reduce((sum, t) => sum + t.quantity, 0);
    const totalSellQuantity = sells.reduce((sum, t) => sum + t.quantity, 0);
    const totalBuyValue = buys.reduce((sum, t) => sum + t.netAmount, 0);
    const totalSellValue = sells.reduce((sum, t) => sum + t.netAmount, 0);

    const realizedPnL = calculateFIFOPnL(buys, sells);

    // Get current holding for unrealized P&L
    const holding = holdings.find(h => h.stockSymbol === symbol);
    const currentHolding = totalBuyQuantity - totalSellQuantity;
    const unrealizedPnL = holding ? (holding.unrealizedPnL || 0) : 0;

    const companyName = buys[0]?.companyName || sells[0]?.companyName || symbol;

    stockMap.set(symbol, {
      stockSymbol: symbol,
      companyName,
      totalBuyQuantity,
      totalSellQuantity,
      currentHolding,
      totalBuyValue,
      totalSellValue,
      realizedPnL,
      unrealizedPnL,
      totalPnL: realizedPnL + unrealizedPnL,
      avgBuyPrice: totalBuyQuantity > 0 ? totalBuyValue / totalBuyQuantity : 0,
      avgSellPrice: totalSellQuantity > 0 ? totalSellValue / totalSellQuantity : 0,
    });
  }

  return Array.from(stockMap.values());
}

/**
 * Generate transaction report in Excel format
 */
export async function generateTransactionReport(filters: ReportFilters): Promise<Buffer> {
  const { userId, startDate, endDate, type, symbol, source } = filters;

  // Build where clause for transactions
  const where: any = { userId };

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) {
      where.timestamp.gte = new Date(startDate);
    }
    if (endDate) {
      where.timestamp.lte = new Date(endDate);
    }
  }

  if (type && type !== 'ALL') {
    where.type = type;
  }

  if (symbol) {
    where.stockSymbol = symbol;
  }

  if (source && source !== 'ALL') {
    where.source = source;
  }

  // Fetch transactions and holdings
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { timestamp: 'desc' },
  });

  const holdings = await prisma.holding.findMany({
    where: { userId },
  });

  // Calculate stock-wise P&L
  const stockWisePnL = await calculateStockWisePnL(transactions, holdings);

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AlgoGainz';
  workbook.created = new Date();

  // ===== SHEET 1: Detailed Transactions =====
  const transactionsSheet = workbook.addWorksheet('Transactions');

  // Add headers
  transactionsSheet.columns = [
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Symbol', key: 'symbol', width: 15 },
    { header: 'Company Name', key: 'companyName', width: 30 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Price/Share', key: 'pricePerShare', width: 15 },
    { header: 'Gross Amount', key: 'grossAmount', width: 15 },
    { header: 'Brokerage', key: 'brokerage', width: 12 },
    { header: 'Exchange Charges', key: 'exchangeCharges', width: 15 },
    { header: 'GST', key: 'gst', width: 12 },
    { header: 'SEBI Charges', key: 'sebiCharges', width: 12 },
    { header: 'Stamp Duty', key: 'stampDuty', width: 12 },
    { header: 'Total Charges', key: 'totalCharges', width: 15 },
    { header: 'Net Amount', key: 'netAmount', width: 15 },
    { header: 'Source', key: 'source', width: 20 },
    { header: 'Order ID', key: 'orderIdRef', width: 25 },
  ];

  // Style header row
  const headerRow = transactionsSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add transaction data
  transactions.forEach((txn: Transaction) => {
    const row = transactionsSheet.addRow({
      date: new Date(txn.timestamp).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      symbol: txn.stockSymbol,
      companyName: txn.companyName,
      type: txn.type,
      quantity: txn.quantity,
      pricePerShare: txn.pricePerShare,
      grossAmount: txn.grossAmount,
      brokerage: txn.brokerage,
      exchangeCharges: txn.exchangeCharges,
      gst: txn.gst,
      sebiCharges: txn.sebiCharges,
      stampDuty: txn.stampDuty,
      totalCharges: txn.totalCharges,
      netAmount: txn.netAmount,
      source: txn.source,
      orderIdRef: txn.orderIdRef || '-',
    });

    // Color code by transaction type
    row.getCell('type').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: txn.type === 'BUY' ? 'FFE8F5E9' : 'FFFFEBEE' },
    };

    // Format currency cells
    ['pricePerShare', 'grossAmount', 'brokerage', 'exchangeCharges', 'gst',
     'sebiCharges', 'stampDuty', 'totalCharges', 'netAmount'].forEach(key => {
      row.getCell(key).numFmt = '₹#,##0.00';
    });
  });

  // Add borders
  transactionsSheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // ===== SHEET 2: Summary Statistics =====
  const summarySheet = workbook.addWorksheet('Summary Statistics');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  // Calculate summary statistics
  const totalBuys = transactions.filter((t: Transaction) => t.type === 'BUY').length;
  const totalSells = transactions.filter((t: Transaction) => t.type === 'SELL').length;
  const totalTrades = transactions.length;
  const totalBuyValue = transactions
    .filter((t: Transaction) => t.type === 'BUY')
    .reduce((sum: number, t: Transaction) => sum + t.netAmount, 0);
  const totalSellValue = transactions
    .filter((t: Transaction) => t.type === 'SELL')
    .reduce((sum: number, t: Transaction) => sum + t.netAmount, 0);
  const totalCharges = transactions.reduce((sum: number, t: Transaction) => sum + t.totalCharges, 0);
  const totalRealizedPnL = stockWisePnL.reduce((sum, s) => sum + s.realizedPnL, 0);
  const totalUnrealizedPnL = stockWisePnL.reduce((sum, s) => sum + s.unrealizedPnL, 0);
  const totalPnL = totalRealizedPnL + totalUnrealizedPnL;
  const profitableTrades = stockWisePnL.filter(s => s.realizedPnL > 0).length;
  const winRate = stockWisePnL.length > 0 ? (profitableTrades / stockWisePnL.length) * 100 : 0;

  // Style header
  const summaryHeaderRow = summarySheet.getRow(1);
  summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summaryHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' },
  };
  summaryHeaderRow.height = 25;

  // Add summary data
  const summaryData = [
    { metric: 'Total Transactions', value: totalTrades },
    { metric: 'Total Buy Orders', value: totalBuys },
    { metric: 'Total Sell Orders', value: totalSells },
    { metric: 'Total Buy Value', value: `₹${totalBuyValue.toFixed(2)}` },
    { metric: 'Total Sell Value', value: `₹${totalSellValue.toFixed(2)}` },
    { metric: 'Total Charges Paid', value: `₹${totalCharges.toFixed(2)}` },
    { metric: 'Realized P&L', value: `₹${totalRealizedPnL.toFixed(2)}` },
    { metric: 'Unrealized P&L', value: `₹${totalUnrealizedPnL.toFixed(2)}` },
    { metric: 'Total P&L', value: `₹${totalPnL.toFixed(2)}` },
    { metric: 'Unique Stocks Traded', value: stockWisePnL.length },
    { metric: 'Profitable Positions', value: profitableTrades },
    { metric: 'Win Rate', value: `${winRate.toFixed(2)}%` },
  ];

  summaryData.forEach(item => {
    const row = summarySheet.addRow(item);
    row.getCell('metric').font = { bold: true };

    // Color code P&L values
    if (item.metric.includes('P&L') || item.metric === 'Total P&L') {
      const pnlValue = parseFloat(String(item.value).replace(/[₹,]/g, ''));
      row.getCell('value').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: pnlValue >= 0 ? 'FFE8F5E9' : 'FFFFEBEE' },
      };
      row.getCell('value').font = {
        bold: true,
        color: { argb: pnlValue >= 0 ? 'FF2E7D32' : 'FFC62828' }
      };
    }
  });

  // Add borders
  summarySheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // ===== SHEET 3: Stock-wise P&L =====
  const pnlSheet = workbook.addWorksheet('Stock-wise P&L');

  pnlSheet.columns = [
    { header: 'Symbol', key: 'symbol', width: 15 },
    { header: 'Company Name', key: 'companyName', width: 30 },
    { header: 'Total Buy Qty', key: 'totalBuyQty', width: 15 },
    { header: 'Total Sell Qty', key: 'totalSellQty', width: 15 },
    { header: 'Current Holding', key: 'currentHolding', width: 15 },
    { header: 'Avg Buy Price', key: 'avgBuyPrice', width: 15 },
    { header: 'Avg Sell Price', key: 'avgSellPrice', width: 15 },
    { header: 'Total Buy Value', key: 'totalBuyValue', width: 18 },
    { header: 'Total Sell Value', key: 'totalSellValue', width: 18 },
    { header: 'Realized P&L', key: 'realizedPnL', width: 18 },
    { header: 'Unrealized P&L', key: 'unrealizedPnL', width: 18 },
    { header: 'Total P&L', key: 'totalPnL', width: 18 },
  ];

  // Style header
  const pnlHeaderRow = pnlSheet.getRow(1);
  pnlHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  pnlHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' },
  };
  pnlHeaderRow.height = 25;
  pnlHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add stock-wise P&L data
  stockWisePnL.forEach(stock => {
    const row = pnlSheet.addRow({
      symbol: stock.stockSymbol,
      companyName: stock.companyName,
      totalBuyQty: stock.totalBuyQuantity,
      totalSellQty: stock.totalSellQuantity,
      currentHolding: stock.currentHolding,
      avgBuyPrice: stock.avgBuyPrice,
      avgSellPrice: stock.avgSellPrice,
      totalBuyValue: stock.totalBuyValue,
      totalSellValue: stock.totalSellValue,
      realizedPnL: stock.realizedPnL,
      unrealizedPnL: stock.unrealizedPnL,
      totalPnL: stock.totalPnL,
    });

    // Format currency cells
    ['avgBuyPrice', 'avgSellPrice', 'totalBuyValue', 'totalSellValue',
     'realizedPnL', 'unrealizedPnL', 'totalPnL'].forEach(key => {
      row.getCell(key).numFmt = '₹#,##0.00';
    });

    // Color code P&L cells
    ['realizedPnL', 'unrealizedPnL', 'totalPnL'].forEach(key => {
      const cell = row.getCell(key);
      const value = stock[key as keyof StockPnL] as number;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: value >= 0 ? 'FFE8F5E9' : 'FFFFEBEE' },
      };
      cell.font = {
        color: { argb: value >= 0 ? 'FF2E7D32' : 'FFC62828' }
      };
    });
  });

  // Add borders
  pnlSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
