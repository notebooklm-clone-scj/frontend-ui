type JwtPayload = {
  sub?: string;
  exp?: number;
  iat?: number;
};

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return Buffer.from(padded, "base64").toString("utf-8");
}

export function decodeJwtPayload(token: string): JwtPayload {
  const parts = token.split(".");

  if (parts.length < 2) {
    throw new Error("유효하지 않은 JWT 형식입니다.");
  }

  return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
}

export function getUserIdFromToken(token: string) {
  const payload = decodeJwtPayload(token);
  const userId = Number(payload.sub);

  if (!Number.isFinite(userId)) {
    throw new Error("JWT에서 userId를 읽을 수 없습니다.");
  }

  return userId;
}
