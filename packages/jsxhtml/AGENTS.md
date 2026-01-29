# Project Instructions

- Create `src/htmlspec/elements/` with one file per HTML element (e.g. `a.ts`, `abbr.ts`, `acronym.ts`).
- Put element-specific attributes in each element file.
- Use per-element attribute interfaces ending with "Attributes" (not "Element").
- Each element file should expose a type for full attributes, e.g. `type AAttributes = ASpecificAttributes & CommonProps<HTMLAnchorElement>` or `interface ASpecificAttributes extends CommonProps<HTMLAnchorElement>`.
- Update `src/htmlspec/IntrinsicElements.ts` so each element references its own attributes (e.g. `a: AAttributes`).
- Rename/refactor `src/htmlspec/AnchorElement.ts` to `src/htmlspec/a.ts`.
- Create `src/htmlspec/attributes/` for shared attribute groups; refactor `src/htmlspec/GlobalAttributes.ts` into it.
- Add `@experimental` tags to experimental elements/attributes and `@deprecated` to deprecated ones.
