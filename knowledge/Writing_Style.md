# Writing Style

How prose in this repository is written. Vocabulary is a separate question, settled by [DATA_DICTIONARY.md](./DATA_DICTIONARY.md) and enforced by `scripts/check-vocabulary.js`; this file governs sentence construction, which no dictionary covers.

**Scope:** the `knowledge/` specs, `Primer/content/`, and every string a reader meets in an app. The register is a technical manual: a reader consults it to find out what something does, and reads only the part they came for.

---

## 1.0 Verbs

**1.1 A verb states the operation performed.** The subject of a sentence in a spec is a process, a value, or a store, and none of them act.

| Not this | This |
|---|---|
| the weight carries the drift | the weight is the ratio of amplitude to drift |
| the adjustment sits at the long end | the adjustment applies from 2040 onward |
| the error creeps in over the horizon | the error grows with the horizon |
| the fit wants more anchors | the fit is underdetermined below three anchors |

**1.2 A process does not know, need, want, decide, see, try, or remember.** It has inputs and an output. Where a sentence reaches for one of those verbs, the operation itself has not been identified yet.

| Not this | This |
|---|---|
| the process knows which month to use | the calendar month of the maturity date selects the factor |
| the renderer decides whether to clip | the axis floor is applied when the minimum yield is negative |

**1.3 A measurement does not argue, suggest, or tell.** State the measured quantity and what follows from it.

---

## 2.0 Metaphor

**2.1 No metaphor stands in for a defined term.** Where a term exists it is the only correct word, and a metaphor that reads well is the failure mode rather than evidence of success. *Leg*, a *block* of years, a CPI *print*, a value *stamped* at 17:05, a factor that *fades*: each was introduced because it read naturally and each had to be removed.

**2.2 A metaphor with no term behind it is still not written.** Where nothing defined fits, say what is missing and ask. New terms are the developer's to approve.

**2.3 Literal use of a word that is elsewhere a metaphor is correct.** A chart line drawn at reduced opacity fades. A file holds bytes.

---

## 3.0 Sentences

**3.1 Lead with what the thing does.** A section that opens by saying what something is not, or by narrating how it came to exist, has buried its subject.

**3.2 One claim per sentence.** Semicolons joining enumerations become bulleted lists.

**3.3 No self-reference.** The prose does not discuss its own earlier wording, its revision history, or what it is about to say. It also does not negate a claim nobody made: *X, not necessarily Y* asserts Y was in question.

**3.4 No editorial flourish.** *Of course*, *importantly*, *it is worth noting*, *simply put* and *needless to say* add emphasis in place of information.

**3.5 No instructions to a future editor.** *Do not restate*, *review this when editing*, maintenance sections and agent banners are not content a reader came for. A cross-reference is written as a plain pointer.

---

## 4.0 Precision

**4.1 A number carries its basis.** A figure without its date, window, or units is unverifiable. *0.263% from the 2015–2019 vintages* is checkable; *about a quarter of a percent* is not.

**4.2 Attribute a claim to what establishes it.** A result of a measurement, an assumption of a cited author, and a judgment are three different things and a reader acts differently on each.

**4.3 Link rather than restate.** Where another document owns a rule, point at it. A restatement is a copy that drifts.

**4.4 Quote a source exactly, or do not present it as a quote.** This applies to the CFRs, to Canty, and to anything the repository summarizes.

---

## 5.0 Enforcement

`scripts/check-vocabulary.js` gates the mechanically detectable rules on the lines a commit adds or changes: banned terms, the anthropomorphic verbs in 1.2, the placement metaphors in 1.1, and the flourishes in 3.4. `--audit` lists what already exists across the repository.

The rest is not detectable and does not become optional for that reason. The test applied when reading a passage back is whether every term in it is the one the Data Dictionary defines, and whether every verb states an operation. Prose that reads well passes neither test on its own.
