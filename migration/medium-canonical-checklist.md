# Medium → new-site canonical checklist (Phase 6.3)

Goal: consolidate SEO on `praveergupta.in` by pointing every Medium copy back to its new
home (or removing it). Medium can't be 301'd, so for each story either **set the canonical /
"original source"** to the new URL, or **unpublish** it now that the new site is live.

How to set the canonical on a Medium story:

- Open the story in the Medium editor → **••• (More) → Story settings** → **Advanced settings**
  → **"Canonical link"** / "Tell us where this was originally published" → paste the new URL.
- (Medium also exposes this when you originally _import_ a story; for existing native stories
  use the Advanced settings above. If your account/plan doesn't expose a canonical field, the
  fallback is to **unpublish** the story or replace its body with a short "this post has moved
  → <new URL>" stub that links to the new page.)

---

## A. Stories with a new home — set canonical to the new URL (14)

- [ ] `practical-guide-to-java-stream-api-7aadc02908f7` → `https://praveergupta.in/blog/practical-guide-to-java-stream-api/`
- [ ] `offline-installation-of-python-packages-and-ruby-gems-1b1256689c71` → `https://praveergupta.in/blog/offline-installation-of-python-packages-and-ruby-gems/`
- [ ] `using-java-8s-function-interface-for-extension-1f6a788af8a4` → `https://praveergupta.in/blog/using-java-8-function-interface-for-extension/`
- [ ] `practical-guide-to-java-8s-date-time-api-baa08374b675` → `https://praveergupta.in/blog/practical-guide-to-java-8-s-date-time-api/`
- [ ] `scoped-objects-in-dagger-2-ba7dd479e3b8` → `https://praveergupta.in/blog/scoped-objects-in-dagger-2/`
- [ ] `understanding-thread-interruption-in-java-74789fc504bb` → `https://praveergupta.in/blog/understanding-thread-interruption-in-java/`
- [ ] `java-8s-optional-as-a-monad-72c0bc844084` → `https://praveergupta.in/blog/java-8-optional-as-a-monad/`
- [ ] `how-functional-programming-helps-me-write-clean-code-2a80a6a86dbd` → `https://praveergupta.in/blog/how-functional-programming-helps-me-write-clean-code/`
- [ ] `writing-comparators-the-java-8-way-4d91c150c444` → `https://praveergupta.in/blog/writing-comparators-the-java8-way/`
- [ ] `using-asynchrony-to-reduce-response-times-in-java-8-a10d254877fd` → `https://praveergupta.in/blog/using-asynchrony-to-reduce-response-times/`
- [ ] `writing-test-data-builders-made-easy-with-kotlin-8d4409d87efd` → `https://praveergupta.in/blog/writing-test-data-builders-made-easy-with-kotlin/`
- [ ] `testing-rest-apis-with-rest-assured-2bfe9dfc9d07` → `https://praveergupta.in/blog/testing-rest-apis-with-rest-assured/`
- [ ] `book-review-soft-skills-the-software-developers-life-manual-b44b2cecf1c4` → `https://praveergupta.in/blog/book-review-soft-skills/`
- [ ] `spring-up-an-application-quickly-with-spring-boot-46ce3f8fc51b` → `https://praveergupta.in/blog/spring-up-an-application-quickly-with-spring-boot/`

## B. Medium-only stories — no new page yet (5)

These currently **404** on `praveergupta.in` (parked in `url-inventory.csv`). For each, either
**recreate** the post on the new site (then add it to the inventory + set the Medium canonical
to the new URL), or **unpublish** the Medium story. Do **not** redirect these to the home page.

- [ ] `tackling-asynchrony-with-kotlin-coroutines-4cfeacb36d1c` — technical; recreate, then canonical
- [ ] `harnessing-the-power-of-java-8-streams-67517312447a` — talk writeup (IndicThreads 2016); recreate or unpublish
- [ ] `how-to-think-in-rxjava-before-reacting-7aa5d550650e` — talk writeup (GeeCON 2016); recreate or unpublish
- [ ] `photography-d2e8f8570677` — non-technical; recreate or unpublish
- [ ] `oneplus-3-pro-user-tips-ecbfb938c488` — non-technical; recreate or unpublish

---

> Source of truth: `migration/url-inventory.csv`. Once a Medium-only story is recreated, give it
> a `new_slug`/`new_path` row there so the redirect + verifier pick it up automatically.
