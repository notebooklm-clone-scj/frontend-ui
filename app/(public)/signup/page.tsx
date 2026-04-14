import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getHomePathByRole, getSession } from "@/lib/auth/session";

export default async function SignupPage() {
  const session = await getSession();

  if (session) {
    redirect(getHomePathByRole(session.role));
  }

  return (
    <main className="public-shell">
      <section className="public-hero">
        <span className="eyebrow">NotebookLM Clone</span>
        <h1>리서치용 노트북을 만드는 가장 빠른 출발점</h1>
        <p>
          회원가입 후 로그인하면 노트북을 만들고 PDF를 업로드해 요약 결과를
          바로 확인할 수 있습니다.
        </p>
      </section>
      <AuthForm mode="signup" />
    </main>
  );
}
