import { Wordmark } from "@/components/brand/full-logo";
import styles from "./customer.module.css";

/**
 * The PapeX RDH — isometric vector render of the REAL enclosure.
 *
 * WHAT THIS USED TO BE, AND WHY IT CHANGED (2026-09-09).
 * The previous version was a matte-BLACK box carrying a white sticker, and on
 * that sticker: "PapeX" set in Kameron plus a hand-drawn four-point triangle
 * that was never the PapeX mark. design-prototype/NOTES.md explains the
 * reasoning — "There is no photo or 3D render of the RDH in the workspace, so
 * the device on the site is a generated vector." That was true for the
 * designer, who only had this repo. It is not true of the workspace: the
 * enclosure renders live in a SIBLING repo, at
 *     Papex_RDH_Firmware/docs/enclosure/rdh_final_top.png
 *     Papex_RDH_Firmware/docs/enclosure/rdh_final_front.png
 * and the real device is a solid PapeX-ORANGE box with the logotype DEBOSSED
 * into its top face — no black plastic, no label, no printed triangle.
 *
 * So the geometry below is unchanged (a true isometric projection of a
 * 100 x 68 x 30 box — regenerate rather than hand-edit if that ever changes)
 * but the material and the marking now match the object the pilot ships.
 *
 * The logotype is the real one: `Wordmark` from components/brand/full-logo.tsx,
 * inlined from the brand vector of record. It is drawn TWICE, offset by half a
 * unit — a light copy behind and a dark copy in front — which is what reads as
 * an engraved channel rather than printed ink. The enclosure's own trailing dot
 * is kept.
 *
 * Inlined rather than `<img src="/product/rdh-device.svg">` so `.rdhLed` can be
 * targeted by CSS and pulsed when the hero's demo phone taps down onto it. The
 * business path renders the same artwork as a plain <img>; keep the two in
 * step — see public/product/rdh-device.svg.
 *
 * The LED is not in the CAD renders (they model the shell only) but the device
 * genuinely has one — Papex_RDH_Firmware/src/led.c drives an 8-state LED
 * language on two discrete LEDs — and the tap interaction depends on it.
 */
export function RdhDevice({ pulsing = false }: { pulsing?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 169.5 138.0"
      role="img"
      aria-label="The PapeX RDH: a small orange device with the PapeX logotype pressed into its top face and a status light."
    >
      <defs>
        {/* Top face — the lit one, and the face the logotype sits on. */}
        <linearGradient id="rdhTop" x1="0" y1="0" x2=".55" y2="1">
          <stop offset="0" stopColor="#F58A1B" />
          <stop offset="1" stopColor="#E06E00" />
        </linearGradient>
        {/* Front: turned away from the key light, so a step darker. */}
        <linearGradient id="rdhFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C75F00" />
          <stop offset="1" stopColor="#A94F00" />
        </linearGradient>
        {/* Side: darkest, which is what gives the box its corner. */}
        <linearGradient id="rdhSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9C4800" />
          <stop offset="1" stopColor="#7E3A00" />
        </linearGradient>
        <radialGradient id="ledGlow">
          <stop offset="0" stopColor="#3ee584" stopOpacity=".8" />
          <stop offset="1" stopColor="#3ee584" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path
        d="M12.00 46.00 L98.60 96.00 L98.60 126.00 L12.00 76.00 Z"
        fill="url(#rdhFront)"
        stroke="#8E4200"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M157.49 62.00 L98.60 96.00 L98.60 126.00 L157.49 92.00 Z"
        fill="url(#rdhSide)"
        stroke="#6E3200"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M70.89 12.00 L157.49 62.00 L98.60 96.00 L12.00 46.00 Z"
        fill="url(#rdhTop)"
        stroke="#F0801A"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />

      {/* Everything in here lies ON the top face: the matrix is that face's
          own coordinate system, so a rectangle drawn square comes out
          correctly foreshortened. */}
      <g transform="matrix(0.86603,0.50000,-0.86603,0.50000,70.890,12.000)">
        <circle
          className={`${styles.rdhLed} ${pulsing ? styles.rdhLedPulsing : ""}`}
          cx="29"
          cy="59"
          r="12"
          fill="url(#ledGlow)"
        />
        <circle cx="29" cy="59" r="3.4" fill="#54ffa6" />
        <circle cx="29" cy="59" r="1.6" fill="#f0fff7" />

        {/* The deboss. Light copy first (the far wall of the channel catching
            light), dark copy over it (the cut itself). */}
        <g transform="translate(46,17)">
          <g transform="translate(0,0.9)" opacity=".55">
            <Wordmark size={48} letters="#FFB06A" />
          </g>
          <Wordmark size={48} letters="#8A3F00" />
        </g>
        {/* The enclosure carries a dot after the logotype — keep it. */}
        <circle cx="99.5" cy="26.5" r="2.1" fill="#8A3F00" opacity=".85" />
        <circle cx="99.5" cy="25.6" r="2.1" fill="#FFB06A" opacity=".4" />
      </g>

      {/* Top edge highlight — the seam where the two lit faces meet. */}
      <path
        d="M12.00 46.00 L70.89 12.00 L157.49 62.00"
        fill="none"
        stroke="#FFC38A"
        strokeWidth="1"
        strokeLinecap="round"
        opacity=".8"
      />
    </svg>
  );
}
