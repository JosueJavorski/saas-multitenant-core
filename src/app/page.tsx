import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background font-sans p-6">
      <main className="flex flex-col items-center max-w-2xl text-center space-y-8">
        <div className="flex items-center gap-2">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={24}
            priority
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            SaaS Multitenant Core
          </h1>
          <p className="max-w-md mx-auto text-lg text-muted-foreground">
            Sua fundação sólida de SaaS com Next.js, Supabase, Stripe e shadcn-ui.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs sm:max-w-none">
          <Link
            href="/login"
            className={buttonVariants({ variant: "default", size: "lg", className: "w-full sm:w-auto" })}
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
          >
            Criar Conta
          </Link>
        </div>
      </main>
    </div>
  );
}
