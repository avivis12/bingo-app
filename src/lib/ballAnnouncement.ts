// הכרזת כדור בעברית — אות העמודה (לפי הגייה עברית) + המספר
// B=1-15, I=16-30, N=31-45, G=46-60, O=61-75

const HEBREW_LETTERS: Record<string, string> = {
  B: "בי",
  I: "איי",
  N: "אן",
  G: "ג'י",
  O: "או",
};

export function getColumnLetter(ball: number): "B" | "I" | "N" | "G" | "O" {
  if (ball >= 1 && ball <= 15) return "B";
  if (ball >= 16 && ball <= 30) return "I";
  if (ball >= 31 && ball <= 45) return "N";
  if (ball >= 46 && ball <= 60) return "G";
  if (ball >= 61 && ball <= 75) return "O";
  throw new Error(`Invalid ball number: ${ball}`);
}

/** מחזיר הכרזה בעברית לכדור, למשל "בי 12" */
export function announceBallInHebrew(ball: number): string {
  const col = getColumnLetter(ball);
  return `${HEBREW_LETTERS[col]} ${ball}`;
}
