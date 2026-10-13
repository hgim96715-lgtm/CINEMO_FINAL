import {PostcardFeed} from "@/components/postcard/PostcardFeed";

export default function PostcardsPage() {
  return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="text-sm tracking-[0.2em] text-cinemo-gold">
            CINEMO COMMUNITY
          </p>
          
          <h1 className="mt-2 text-3xl font-semibold text-white">
            공개 엽서
          </h1>
          
          <p className="mt-3 text-sm text-cinemo-muted">
            영화에 대한 기억과 감상을 함께 나누는 공간
          </p>
        </header>
        
        <PostcardFeed />
      </main>
  );
}