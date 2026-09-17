import { prisma } from "@/lib/prisma";
import { CoinTransactionType, Prisma } from "@prisma/client";

/**
 * מזכה מטבעות למשתמש (הזנה ידנית ע"י אדמין, זכייה, וכו').
 * תמיד בתוך טרנזקציית DB כדי שהיתרה וה-Ledger יישארו עקביים.
 */
export async function creditCoins(params: {
  userId: string;
  amount: number; // חייב להיות חיובי
  type: CoinTransactionType;
  note?: string;
  gameId?: string;
  performedByAdminId?: string;
}) {
  const { userId, amount, type, note, gameId, performedByAdminId } = params;
  if (amount <= 0) throw new Error("amount must be positive for a credit");

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { coinsBalance: { increment: amount } },
    });

    await tx.coinTransaction.create({
      data: { userId, amount, type, note, gameId, performedByAdminId },
    });

    return user.coinsBalance;
  });
}

/**
 * מחייב (מוריד) מטבעות ממשתמש — רכישת כרטיס, טיפ, אישור החזר וכו'.
 * בודק בתוך הטרנזקציה שיש מספיק יתרה, כדי למנוע יתרה שלילית ב-race condition.
 */
export async function debitCoins(params: {
  userId: string;
  amount: number; // חייב להיות חיובי — הפונקציה מטפלת בהורדה
  type: CoinTransactionType;
  note?: string;
  gameId?: string;
  performedByAdminId?: string;
}) {
  const { userId, amount, type, note, gameId, performedByAdminId } = params;
  if (amount <= 0) throw new Error("amount must be positive for a debit");

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.coinsBalance < amount) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: { coinsBalance: { decrement: amount } },
    });

    await tx.coinTransaction.create({
      data: { userId, amount: -amount, type, note, gameId, performedByAdminId },
    });

    return updated.coinsBalance;
  });
}
