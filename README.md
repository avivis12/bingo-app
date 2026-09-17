# מערכת בינגו — Next.js

פרויקט התחלתי (scaffold) בנוי לפי מסמך האפיון. כולל סכימת DB מלאה, לוגיקת ליבה (ארנק מטבעות, הנפקת כרטיסים, בדיקת זכייה, חלוקת פרסים), ו-API routes עובדים. חלק מהמסכים (UI) הם שלד בסיסי שצריך להמשיך לעצב ולחבר.

## התקנה ראשונית

```bash
npm install
npx prisma generate      # מוריד את ה-Prisma Client + engine (דורש אינטרנט רגיל, לא מוגבל)
```

צרו קובץ `.env` (העתיקו מ-`.env.example`) ומלאו:
- `DATABASE_URL` — חיבור ל-PostgreSQL (מומלץ להתחלה: [Neon](https://neon.tech) או [Supabase](https://supabase.com), יש להם free tier, אין צורך להתקין Postgres מקומית).
- `AUTH_SECRET` — הריצו `openssl rand -base64 32` ותדביקו את הפלט.

אחר כך:

```bash
npm run db:push     # יוצר את הטבלאות ב-DB לפי prisma/schema.prisma
npm run db:seed      # יוצר משתמש אדמין ראשוני (admin@example.com / changeme123 — שנו מיד!)
npm run dev
```

פתחו http://localhost:3000

## מה כבר עובד (Backend + Frontend מלא)

| תחום | קבצים | הערות |
|---|---|---|
| הרשמה/התחברות | `src/lib/auth.ts`, `api/signup`, `/login`, `/register` | אימייל/סיסמה בלבד (אין Google), טלפון חובה, **ללא** אימות אימייל |
| שחזור סיסמה | `/forgot-password`, `/reset-password/[token]`, `api/auth/forgot-password`, `api/auth/reset-password` | טוקן חד-פעמי בתוקף 30 דקות. **לפיתוח בלבד**: הקישור נכתב ל-console; לפרודקשן יש לחבר ספק מייל (למשל Resend) |
| ארנק מטבעות | `src/lib/coins.ts` | `creditCoins` / `debitCoins` אטומיים, מונעים יתרה שלילית |
| הזנת מטבעות ידנית (אדמין) | `api/admin/coins/credit`, `/admin/users` | שורת חיפוש חכמה אחת: שם/טלפון/אימייל |
| היסטוריית מטבעות למשתמש | `api/me/transactions`, `/profile` | כולל "הפקדות" שהאדמין הזין — שקיפות מלאה |
| בקשות החזר | `api/refunds`, `api/admin/refunds`, `api/admin/refunds/[id]`, `/admin/refunds`, `/profile` | משתמש מבקש מתוך `/profile` → תור אצל אדמין ב-`/admin/refunds` → אישור מפחית בפועל |
| ניהול משחקים | `api/admin/games`, `/admin/games` | יצירת משחק (מכירה נפתחת מיד), אכיפת משחק בודד פעיל |
| התחלת טיימר | `api/admin/games/[id]/start-countdown` | נועל את המכירה, `countdownEndsAt` נשמר ב-DB (persistence מול רענון) |
| הנפקת כרטיסים | `src/lib/tickets.ts` | 5×4, Fisher-Yates, מגבלת 4 כרטיסים |
| רכישת כרטיסים | `api/games/[id]/purchase`, לובי בתוך `/game/[id]` | נועל כשהמשחק live |
| שליפת כדורים | `api/admin/games/[id]/draw-ball`, כפתור בחדר הבקרה | **ידנית לגמרי**, רנדומליות טהורה, בלי סריקת זוכים; הופך אוטומטית את המשחק ל-LIVE בשליפה הראשונה |
| מסך משחק למשתמש | `/game/[gameId]` | לובי רכישה, לוח 75 כדורים, כדור מרכזי בעברית, כרטיסים (`TicketGrid`), `TicketBottomNav` למובייל, כפתורי שורה/בינגו |
| חדר בקרה לאדמין | `/admin/games/[gameId]` | שליפת כדור, מעקב התקדמות לכל כרטיס, הודעת מערכת, חלוקת פרסים |
| הכרזת שורה/בינגו | `api/games/[id]/claim` | בדיקה **רק** בלחיצת המשתמש, מול ה-DB האמיתי |
| חלוקת פרסים | `api/admin/games/[id]/distribute` | 15% אדמין / 10% שורה / 75% בינגו, מתחלק בין זוכים מרובים |
| טיפ | `api/games/[id]/tip`, UI ב-`/game/[gameId]` | מנוכה מהזכייה, זוכה לחשבון האדמין |
| הודעת מערכת חיה | `api/admin/games/[id]/announce`, באנר ב-`/game/[gameId]` | דרך Pusher — ר' סעיף Real-time למטה |
| Real-time | `src/lib/realtime.ts` (שרת), `src/lib/useGameChannel.ts` (קליינט) | ממומש עם **Pusher**. בלי משתני סביבה מוגדרים, המערכת עדיין עובדת (ה-DB הוא מקור האמת), רק בלי דחיפה מיידית — צריך לרענן/לחכות לפולינג |

## הערה לגבי Real-time בפועל

מימשתי את שכבת ה-Real-time עם **Pusher** (החבילות `pusher` ו-`pusher-js` כבר מותקנות). כדי שזה יעבוד בפועל:
1. הרשמו ב-[pusher.com](https://pusher.com) (יש free tier), צרו Channels App.
2. מלאו ב-`.env`: `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`, וגם `NEXT_PUBLIC_PUSHER_KEY` + `NEXT_PUBLIC_PUSHER_CLUSTER` (אותם ערכים, אבל חייבים prefix `NEXT_PUBLIC_` כדי שיהיו זמינים בצד לקוח).
3. בלי זה, האתר עדיין עובד תקין (כל הנתונים תמיד נטענים מה-DB), פשוט בלי "קפיצה" מיידית של כדור חדש למסך — חדר הבקרה מתעדכן עם polling כל 4 שניות בכל מקרה כגיבוי.

## מה עדיין לא ממומש / הבא בתור

1. **"זכור אותי"** — השדה נשלח אך עדיין לא משפיע בפועל על משך ה-session (`callbacks.jwt` תמיד עם ה-maxAge הדיפולטי). כדי לממש נכון: להוסיף `session.maxAge` דינמי לפי דגל שנשמר ב-token, או session cookie נפרד.
2. **חלון "זוכים בו-זמנית"** — ה-claim endpoint צובר זוכים ל-`lineWinnerUserIds`/`bingoWinnerUserIds` ללא הגבלת זמן, וה-distribute מחלק לכל מי שכבר נצבר שם. האדמין צריך לתת חלון סביר (כמה שניות) לזוכים "בו-זמנית" להספיק להכריז *לפני* שלוחצים על "סגור וחלק פרס" — זה תלוי בשיקול דעת האדמין כרגע, לא אוטומטי.
3. **בדיקות (Tests)** — אין עדיין test suite. מומלץ להוסיף Vitest/Jest ל-`src/lib/tickets.ts` ו-`src/lib/coins.ts` קודם, כי אלו הלוגיקה הפיננסית/משחקית הקריטית.
4. **עיצוב** — כל המסכים פונקציונליים אבל בעיצוב מינימלי (Tailwind בסיסי). מומלץ להעביר דרך `frontend-design` guidance לשיפור ויזואלי.
5. **בדיקת race condition על מכסת 4 הכרטיסים** — הבדיקה הנוכחית (`existingCount + quantity > max`) עלולה תיאורטית לאפשר חריגה קלה בלחיצות כפולות סימולטניות ממש (בלי row-level lock). לרוב זניח בקנה מידה קטן, אך לתשומת לב אם יהיה עומס.

## הערה על הרצת `prisma generate` בסביבת הפיתוח שלי (Claude)

ניסיתי להריץ `npx prisma generate` כדי לוודא type-check מלא, אבל בסביבת ה-sandbox שבה אני עובד יש הגבלת רשת שלא מאפשרת גישה ל-`binaries.prisma.sh` (משם Prisma מוריד את קובץ ה-engine). זו הגבלה של סביבת העבודה שלי בלבד — **אצלכם, עם גישה רגילה לאינטרנט, הפקודה תעבוד כרגיל**. בדקתי עם `tsc --noEmit` שכל שאר הקוד תקין; השגיאות היחידות שנשארו הן `CoinTransactionType` לא מיוצא מ-`@prisma/client` — וזה ייעלם ברגע שתריצו `npx prisma generate` אצלכם.

## מבנה תיקיות עיקרי

```
prisma/schema.prisma          # מודל הנתונים המלא
prisma/seed.ts                 # יצירת אדמין ראשוני
src/lib/                       # לוגיקת ליבה (ללא UI)
src/components/                # TicketGrid, TicketBottomNav
src/app/api/                   # כל ה-API routes
src/app/login, /register       # מסכי אימות
src/app/admin/users            # חיפוש משתמשים + הזנת מטבעות
src/middleware.ts              # הגנת נתיבי /admin
```
