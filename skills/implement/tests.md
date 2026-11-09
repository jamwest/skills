# Good and Bad Tests

## Good Tests

**Integration-style**: Test through real interfaces, not mocks of internal parts.

```typescript
// GOOD: Tests observable behavior
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

Characteristics:

- Tests behavior users/callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test

## Bad Tests

**Implementation-detail tests**: Coupled to internal structure.

```typescript
// BAD: Tests implementation details
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

Red flags:

- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means instead of interface

```typescript
// BAD: Bypasses interface to verify
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// GOOD: Verifies through interface
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

## Test Data Isolation

Each test creates the data it needs and doesn't depend on what other tests or a shared fixture
left behind.

```typescript
// BAD: Assumes row 42 / this email already exists in a shared fixture
test("getUser returns the admin", async () => {
  const user = await getUser(42);
  expect(user.email).toBe("admin@example.com");
});

// GOOD: Creates its own data, asserts on what it created
test("getUser returns the user just created", async () => {
  const created = await createUser({ email: "admin@example.com", role: "admin" });
  const user = await getUser(created.id);
  expect(user.email).toBe("admin@example.com");
});
```

Red flags: a literal ID, email, or row assumed to pre-exist; a test that only passes if another
test ran first or a seed script was applied. Use a factory/builder for setup and clean up after
(transactional rollback or explicit teardown) so the test is safe to run alone, in any order, and
in parallel.

## Locators and Waits (UI/E2E tests only)

Applies only when the task under test drives a browser or app UI (Playwright, Selenium, Cypress).

```typescript
// BAD: Positional selector tied to DOM structure, fixed delay
await page.waitForTimeout(3000);
await page.click("/html/body/div[2]/form/button");

// GOOD: Semantic selector, waits on the actual condition
await page.getByRole("button", { name: "Submit" }).click();
```

Red flags: XPath or CSS selectors built from position (`nth-child`, `div[2]/...`) instead of role,
label, text, or a dedicated test attribute; any `sleep`/`waitForTimeout`/`Thread.sleep` standing in
for waiting on a real condition (element visible, request resolved, state changed).
