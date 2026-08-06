# Deep Modules

From "A Philosophy of Software Design":

**Deep module** = small interface + lots of implementation

```
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│                     │
│  Deep Implementation│  ← Complex logic hidden
│                     │
│                     │
└─────────────────────┘
```

**Shallow module** = large interface + little implementation (avoid)

```
┌─────────────────────────────────┐
│       Large Interface           │  ← Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Just passes through
└─────────────────────────────────┘
```

When designing interfaces, ask:

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

## Glossary

Use these terms exactly — don't substitute "component," "service," "API," or "boundary."

- **Module** — anything with an interface and an implementation. Scale-agnostic: a function,
  class, package, or tier-spanning slice.
- **Interface** — everything a caller must know to use the module correctly: type signature,
  invariants, ordering constraints, error modes, required config, performance characteristics.
  Broader than "API" or "signature."
- **Seam** _(Michael Feathers)_ — where a module's interface lives; the place you can alter
  behaviour without editing in that place. Distinct from what goes behind it.
- **Adapter** — a concrete thing that satisfies an interface at a seam. Describes *role*, not
  substance.
- **Leverage** — what callers get from depth: more capability per unit of interface they have to
  learn. One implementation pays back across every call site and every test.
- **Locality** — what maintainers get from depth: change, bugs, and knowledge concentrate in one
  place instead of spreading across callers. Fix once, fixed everywhere.

## Principles

- **The deletion test.** Imagine deleting the module. If complexity vanishes, it was a
  pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.** Callers and tests cross the same seam. Wanting to test
  *past* the interface is usually a sign the module is the wrong shape.
- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a seam
  unless something actually varies across it.
