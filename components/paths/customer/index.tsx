import { FlowGround } from "../shared/FlowGround";
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
 *
 * Sections no longer paint their own bands. Each declares a ground and
 * FlowGround crossfades ONE page-level ground between them (see
 * components/paths/shared/flow.module.css). One swap, not five (2026-09-10):
 *   Hero light · Problem light · ribbon · Personas light · Features light ·
 *   HowItWorks light · Proof navy · Vision navy → (footer navy)
 * `initial="light"` is the hero's colour and MUST match the fork's bottom half.
 * Footer is owned by another agent and rendered by the caller.
 */
export function CustomerPath() {
  return (
    <FlowGround initial="light">
      <Hero />
      <Problem />
      <MarqueeBand />
      <Personas />
      <Features />
      <HowItWorks />
      <Proof />
      <Vision />
    </FlowGround>
  );
}
