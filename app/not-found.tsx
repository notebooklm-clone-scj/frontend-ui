import Link from "next/link";

export default function NotFound() {
  return (
    <main className="public-shell">
      <section className="public-hero">
        <span className="eyebrow">404</span>
        <h1>요청한 노트북을 찾을 수 없습니다.</h1>
        <p>
          현재 로그인한 사용자 기준으로 조회한 노트북 목록에 없는 ID입니다.
          워크스페이스 홈으로 돌아가서 다시 선택해 주세요.
        </p>
      </section>
      <section className="auth-card">
        <h2>다시 이동하기</h2>
        <p>목록에서 노트북을 다시 선택하거나 홈 대시보드로 돌아갈 수 있습니다.</p>
        <div className="button-row">
          <Link className="button" href="/workspace">
            워크스페이스 홈
          </Link>
          <Link className="button-secondary" href="/login">
            로그인 화면
          </Link>
        </div>
      </section>
    </main>
  );
}
