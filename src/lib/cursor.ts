// Keyset pagination cursor for lists ordered by (attemptedAt desc, id desc).
// Opaque to clients: base64url of "<ISO time>|<id>".

export type AttemptCursor = { attemptedAt: Date; id: string };

export function encodeCursor({ attemptedAt, id }: AttemptCursor): string {
  return Buffer.from(`${attemptedAt.toISOString()}|${id}`).toString("base64url");
}

/** null when the cursor is malformed. */
export function decodeCursor(cursor: string): AttemptCursor | null {
  const [iso, id, ...rest] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
  if (!iso || !id || rest.length > 0) return null;
  const attemptedAt = new Date(iso);
  if (Number.isNaN(attemptedAt.getTime())) return null;
  return { attemptedAt, id };
}
