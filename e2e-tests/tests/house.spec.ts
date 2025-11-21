import { test, expect } from "@playwright/test";

// Shared test user credentials
const testUser = {
  name: "E2E Test User",
  username: `e2euser${Date.now()}`,
  email: `e2etest${Date.now()}@example.com`,
  password: "TestPassword123!",
};

const testHouse = {
  name: "E2E Test House",
};

test.describe("House Acceptance Tests", () => {
  test.describe.configure({ mode: "serial" });

  test.describe("Register User", () => {
    test("A new account is created when the user provides a valid email and password", async ({
      page,
    }) => {
      await page.goto("/register");

      // Provide valid email and password
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="username"]', testUser.username);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="confirmPassword"]', testUser.password);
      await page.check("input#terms");
      await page.click('button[type="submit"]');

      // User is redirected to join house page
      await expect(page).toHaveURL("/join-house");

      // Timeout
      await page.waitForTimeout(1000);
    });
  });

  test.describe("Create house", () => {
    test.describe.configure({ mode: "serial" });

    test("A new house is created when the user provides a valid name", async ({
      page,
    }) => {
      await page.goto("/login");

      // Fill in login form with the user created in register tests
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // User is redirected to the join house page
      await expect(page).toHaveURL("/join-house");

      // Fill in create house form with
      await page.fill("#house-name", testHouse.name);
      await page.click("#create-house-btn");

      // User is redirected to the main page with a house id
      await expect(page).toHaveURL(/\/\?houseId=[\w-]+/);

      // Timeout
      await page.waitForTimeout(1000);
    });
  });

  test.describe("Create House in dashboard", () => {
    test.describe.configure({ mode: "serial" });

    test("A new house is created when the user provides a valid name", async ({
      page,
    }) => {
      await page.goto("/login");

      // Fill in login form with the user created in register tests
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // User is redirected to the main page with a house id
      await expect(page).toHaveURL(/\/\?houseId=[\w-]+/);

      await page.goto("/house");

      // Timeout
      await page.waitForTimeout(1000);

      // Fill in create house form with
      await page.fill("#house-name", testHouse.name);
      await page.click("#create-house-btn");

      // Timeout
      await page.waitForTimeout(1000);

      await expect(page.locator("#create-house-success")).toContainText(
        "House created successfully!"
      );

      // Timeout
      await page.waitForTimeout(1000);
    });
  });
});
