/**
 * מבנה כרטיס: 5 עמודות (B,I,N,G,O) × 4 שורות = 20 מספרים.
 * כל עמודה מכילה 4 מספרים ייחודיים אקראיים מתוך טווח של 15 מספרים:
 *   B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
 *
 * הייצוג במסד הנתונים הוא מערך שטוח באורך 20, לפי סדר: עמודה אחר עמודה
 * (numbers[0..3] = B, numbers[4..7] = I, numbers[8..11] = N, numbers[12..15] = G, numbers[16..19] = O)
 *
 * כל עמודה ממוינת בסדר עולה (הקטן ביותר למעלה) כדי להקל על איתור מספרים בכרטיס.
 */

export const COLUMN_RANGES: Array<[number, number]> = [
  [1, 15], // B
  [16, 30], // I
  [31, 45], // N
  [46, 60], // G
  [61, 75], // O
];

export const NUMBERS_PER_COLUMN = 4;
export const TOTAL_BALLS = 75;

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** מייצר כרטיס בינגו רנדומלי חדש — מערך שטוח של 20 מספרים. */
export function generateTicketNumbers(): number[] {
  const numbers: number[] = [];
  for (const [min, max] of COLUMN_RANGES) {
    const pool: number[] = [];
    for (let n = min; n <= max; n++) pool.push(n);
    const shuffled = fisherYatesShuffle(pool);
    // 🔥 מיין את 4 המספרים בסדר עולה (הקטן ביותר ראשון)
    const picked = shuffled
      .slice(0, NUMBERS_PER_COLUMN)
      .sort((a, b) => a - b);
    numbers.push(...picked);
  }
  return numbers;
}

/** ממיר מערך שטוח של 20 מספרים ל"מטריצה" 5 עמודות x 4 שורות לצורך תצוגה. */
export function ticketNumbersToGrid(numbers: number[]): number[][] {
  const grid: number[][] = [];
  for (let col = 0; col < 5; col++) {
    grid.push(numbers.slice(col * NUMBERS_PER_COLUMN, col * NUMBERS_PER_COLUMN + NUMBERS_PER_COLUMN));
  }
  return grid;
}

/** בוחר כדור אקראי מתוך הכדורים שעדיין לא נשלפו במשחק. */
export function drawRandomBall(alreadyDrawn: number[]): number {
  const remaining: number[] = [];
  for (let n = 1; n <= TOTAL_BALLS; n++) {
    if (!alreadyDrawn.includes(n)) remaining.push(n);
  }
  if (remaining.length === 0) throw new Error("NO_BALLS_LEFT");
  const idx = Math.floor(Math.random() * remaining.length);
  return remaining[idx];
}

/**
 * בדיקת שרת אם כרטיס מכיל שורה מלאה (4 שורות אפשריות, כל שורה = מספר אחד מכל עמודה)
 * שכולה בתוך הכדורים שנשלפו.
 */
export function hasCompletedLine(ticketNumbers: number[], drawnBalls: number[]): boolean {
  const grid = ticketNumbersToGrid(ticketNumbers); // 5 columns x 4 rows
  const drawnSet = new Set(drawnBalls);
  for (let row = 0; row < NUMBERS_PER_COLUMN; row++) {
    let complete = true;
    for (let col = 0; col < 5; col++) {
      if (!drawnSet.has(grid[col][row])) {
        complete = false;
        break;
      }
    }
    if (complete) return true;
  }
  return false;
}

/** בדיקת שרת אם כרטיס הושלם במלואו (בינגו מלא — כל 20 המספרים נשלפו). */
export function hasFullBingo(ticketNumbers: number[], drawnBalls: number[]): boolean {
  const drawnSet = new Set(drawnBalls);
  return ticketNumbers.every((n) => drawnSet.has(n));
}

/* ============================================================
 * סימון ידני (המשתמש מסמן את המספרים בעצמו)
 * ============================================================ */

/**
 * בודק שהסימונים של המשתמש תקינים:
 * כל מספר מסומן — באמת נשלף.
 */
export function areMarkingsValid(
  markedNumbers: number[],
  drawnBalls: number[]
): boolean {
  const drawnSet = new Set(drawnBalls);
  return markedNumbers.every((n) => drawnSet.has(n));
}

/**
 * בודק אם הסימונים של המשתמש יוצרים שורה שלמה.
 * שורה = 5 מספרים בשורה אופקית (יש 4 שורות בכרטיס).
 */
export function hasMarkedLine(
  ticketNumbers: number[],
  markedNumbers: number[]
): boolean {
  const grid = ticketNumbersToGrid(ticketNumbers); // 5 columns x 4 rows
  const markedSet = new Set(markedNumbers);
  for (let row = 0; row < NUMBERS_PER_COLUMN; row++) {
    let complete = true;
    for (let col = 0; col < 5; col++) {
      if (!markedSet.has(grid[col][row])) {
        complete = false;
        break;
      }
    }
    if (complete) return true;
  }
  return false;
}

/**
 * בודק אם הסימונים של המשתמש יוצרים בינגו מלא (כל 20 המספרים מסומנים).
 */
export function hasMarkedBingo(
  ticketNumbers: number[],
  markedNumbers: number[]
): boolean {
  const markedSet = new Set(markedNumbers);
  return ticketNumbers.every((n) => markedSet.has(n));
}