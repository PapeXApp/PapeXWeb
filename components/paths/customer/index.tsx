import { Hero } from "./Hero";
import { Problem } from "./Problem";
import { MarqueeBand } from "./MarqueeBand";
import { Personas } from "./Personas";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { Proof } from "./Proof";
import { Vision } from "./Vision";

/**
 * "For Customers" homepage — Screen 2 of the forked landing redesign.
 * Section order + background rhythm is strict alternation, see
 * docs/design/forked-landing/README.md → "Screen 2: Customer Path".
 * Footer is owned by another agent and rendered by the caller.
 */
export function CustomerPath() {
  return (
    <>
      <Hero />
      <Problem />
      <MarqueeBand />
      <Personas />
      <Features />
      <HowItWorks />
      <Proof />
      <Vision />
    </>
  );
}
