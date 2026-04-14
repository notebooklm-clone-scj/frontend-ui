import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getHomePathByRole, getSession } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect(getHomePathByRole(session.role));
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const registered = resolvedSearchParams.registered === "1";

  return (
    <main className="public-shell">
      <section className="public-hero">
        <span className="eyebrow">Next.js + Spring + FastAPI</span>
        <h1>자료를 올리고, 요약을 쌓고, 다음 질문의 출발점을 만드는 워크스페이스</h1>
        <p>
          지금 프론트는 Spring API를 중심으로 붙어 있고, 문서 업로드 결과는
          NotebookLM 스타일의 작업 화면에서 바로 확인할 수 있게 구성했습니다.
        </p>
      </section>
      <AuthForm mode="login" registered={registered} />
    </main>
  );
}
