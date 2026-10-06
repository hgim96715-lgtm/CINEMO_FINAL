const RESERVED_NICKNAMES = new Set([
  "admin",
  "administrator",
  "관리자",
  "운영자",
  "system",
  "cinemo",
  "공식",
]);

const FORBIDDEN_WORDS = ["씨발", "시발", "병신", "개새끼", "ㅅㅂ"];

const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9_-]+$/u;

export function normalizeNickname(value: string) {
  return value.normalize("NFKC").trim();
}

export function validateNickname(value: string) {
  const nickname = normalizeNickname(value);
  const lowerNickname = nickname.toLocaleLowerCase("ko-KR");

  if (!nickname) {
    return "닉네임을 입력해주세요.";
  }

  if (nickname.length < 2 || nickname.length > 30) {
    return "닉네임은 2~30자로 입력해주세요.";
  }

  if (!NICKNAME_PATTERN.test(nickname)) {
    return "닉네임은 한글, 영문, 숫자, _, -만 사용할 수 있습니다.";
  }

  if (RESERVED_NICKNAMES.has(lowerNickname)) {
    return "사용할 수 없는 닉네임입니다.";
  }

  if (FORBIDDEN_WORDS.some((word) => lowerNickname.includes(word))) {
    return "사용할 수 없는 단어가 포함되어 있습니다.";
  }

  return null;
}
