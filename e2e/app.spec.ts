import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// API health (direct HTTP — no browser needed)
// ---------------------------------------------------------------------------

test.describe("Worker API", () => {
  test("GET /health returns ok", async ({ request }) => {
    const resp = await request.get("http://localhost:8000/health");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status).toBe("ok");
    expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("GET /repos/ starts empty", async ({ request }) => {
    const resp = await request.get("http://localhost:8000/repos/");
    expect(resp.status()).toBe(200);
    // May have items from other tests; just assert it's an array
    expect(Array.isArray(await resp.json())).toBe(true);
  });

  test("POST /repos/ creates a repo", async ({ request }) => {
    const resp = await request.post("http://localhost:8000/repos/", {
      data: { name: "e2e-repo", path: "/tmp/e2e-repo" },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.name).toBe("e2e-repo");
    expect(body.repo_id).toBeTruthy();
  });

  test("POST /runs/ creates a run and returns queued state", async ({ request }) => {
    // Register a repo first
    const repoResp = await request.post("http://localhost:8000/repos/", {
      data: { name: "run-e2e-repo", path: "/tmp/run-e2e" },
    });
    const repo = await repoResp.json();

    const runResp = await request.post("http://localhost:8000/runs/", {
      data: { repo_id: repo.repo_id, goal: "E2E smoke test" },
    });
    expect(runResp.status()).toBe(201);
    const run = await runResp.json();
    expect(run.state).toBe("queued");
    expect(run.goal).toBe("E2E smoke test");
  });

  test("POST /runs/ with unknown repo returns 404", async ({ request }) => {
    const resp = await request.post("http://localhost:8000/runs/", {
      data: { repo_id: "ghost-id", goal: "should fail" },
    });
    expect(resp.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Frontend UI
// ---------------------------------------------------------------------------

test.describe("Dashboard UI", () => {
  test("page loads and shows navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/RepoForge/i);
    await expect(page.getByText("🔨 RepoForge")).toBeVisible();
    await expect(page.getByRole("button", { name: "Runs" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Repos" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Approvals" })).toBeVisible();
  });

  test("Runs tab is selected by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Runs" })).toBeVisible();
  });

  test("Repos tab shows registration form", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Repos" }).click();
    await expect(page.getByRole("heading", { name: "Register Repository" })).toBeVisible();
    await expect(page.getByPlaceholder("my-repo")).toBeVisible();
    await expect(page.getByPlaceholder(/local path/i)).toBeVisible();
  });

  test("Approvals tab shows queue", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Approvals" }).click();
    await expect(page.getByRole("heading", { name: "Approval Queue" })).toBeVisible();
  });

  test("can register a repo via the UI", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Repos" }).click();

    await page.getByPlaceholder("my-repo").fill("ui-test-repo");
    await page.getByPlaceholder(/local path/i).fill("/tmp/ui-test-repo");
    await page.getByRole("button", { name: "Register" }).click();

    await expect(page.getByText("✓ Registered")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("ui-test-repo")).toBeVisible();
  });
});
