"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import type { UserRole } from "@/lib/types";

type AuthFormProps = {
  mode: "login" | "signup";
  registered?: boolean;
};

export function AuthForm({ mode, registered = false }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState<string | null>(
    registered ? "회원가입이 완료됐습니다. 이제 로그인해 주세요." : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isLoginMode = mode === "login";

  const title = useMemo(
    () => (isLoginMode ? "워크스페이스 로그인" : "새 계정 만들기"),
    [isLoginMode],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch(
        isLoginMode ? "/api/auth/login" : "/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isLoginMode
              ? { email, password }
              : { email, password, nickname: nickname.trim() },
          ),
        },
      );

      const result = (await response.json()) as {
        ok: boolean;
        id?: number;
        role?: UserRole;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "요청 처리에 실패했습니다.");
      }

      if (isLoginMode) {
        router.push(result.role === "ADMIN" ? "/admin" : "/workspace");
        router.refresh();
        return;
      }

      router.push("/login?registered=1");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="auth-card">
      <span className="eyebrow">{isLoginMode ? "Login" : "Signup"}</span>
      <div>
        <h2>{title}</h2>
        <p>
          {isLoginMode
            ? "Spring 로그인 API에서 JWT를 받아 httpOnly 쿠키로 저장합니다."
            : "가입 후 로그인 화면으로 이동해 바로 작업을 시작할 수 있습니다."}
        </p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field-label">
          이메일
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        {!isLoginMode ? (
          <label className="field-label">
            닉네임
            <input
              autoComplete="nickname"
              onChange={(event) => setNickname(event.target.value)}
              placeholder="리서처 이름"
              required
              value={nickname}
            />
          </label>
        ) : null}

        <label className="field-label">
          비밀번호
          <input
            autoComplete={isLoginMode ? "current-password" : "new-password"}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            type="password"
            value={password}
          />
        </label>

        <div className="button-row">
          <button className="button" disabled={isPending} type="submit">
            {isPending
              ? "처리 중..."
              : isLoginMode
                ? "로그인"
                : "회원가입"}
          </button>

          <Link
            className="button-secondary"
            href={isLoginMode ? "/signup" : "/login"}
          >
            {isLoginMode ? "계정 만들기" : "로그인으로 이동"}
          </Link>
        </div>
      </form>

      {status ? <p className="status-text success">{status}</p> : null}
      {error ? <p className="status-text error">{error}</p> : null}
      <p className="field-hint">
        로그인 성공 시 JWT와 사용자 role을 함께 세션 쿠키에 저장하고, USER는
        워크스페이스로, ADMIN은 관리자 페이지로 바로 분기합니다.
      </p>
    </section>
  );
}
