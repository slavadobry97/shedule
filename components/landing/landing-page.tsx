import { Hero } from "./hero";
import { Features } from "./features";
import { Steps } from "./steps";
import { LandingCta } from "./cta";
import { LandingFooter } from "./footer";

export function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">
                <Hero />
                <Features />
                <Steps />
                <LandingCta />
            </main>
            <LandingFooter />
        </div>
    );
}
