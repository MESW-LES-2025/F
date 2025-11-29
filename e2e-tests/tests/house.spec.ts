import { test, expect } from "@playwright/test";

// Shared test user credentials
const testUser1 = {
  name: "E2E Test User",
  username: `e2euser${Date.now()}`,
  email: `e2etest${Date.now()}@example.com`,
  password: "TestPassword123!",
};

const testUser2 = {
  name: "E2E Test User 2",
  username: `e2euser2${Date.now()}`,
  email: `e2etest2${Date.now()}@example.com`,
  password: "TestPassword123!",
};

const testHouses = [
  {
    name: "E2E Test House",
    inviteCode: "",
  },
  {
    name: "E2E Test House N2",
    inviteCode: "",
  },
];

test.describe("House Acceptance Tests", () => {
  test.describe.configure({ mode: "serial" });

  test.describe("Register User", () => {
    test("A new account is created when the user provides a valid email and password", async ({
      page,
    }) => {
      await page.goto("/register");

      // Provide valid email and password
      await page.fill('input[name="name"]', testUser1.name);
      await page.fill('input[name="username"]', testUser1.username);
      await page.fill('input[name="email"]', testUser1.email);
      await page.fill('input[name="password"]', testUser1.password);
      await page.fill('input[name="confirmPassword"]', testUser1.password);
      await page.check("input#terms");
      await page.click('button[type="submit"]');

      // User is redirected to login page
      await expect(page).toHaveURL("/login");

	  await page.fill('input[name="email"]', testUser1.email);
	  await page.fill('input[name="password"]', testUser1.password);
	  await page.click('button[type="submit"]');

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
      await page.fill('input[name="email"]', testUser1.email);
      await page.fill('input[name="password"]', testUser1.password);
      await page.click('button[type="submit"]');

      // User is redirected to join house page (since they have no house)
      await expect(page).toHaveURL("/join-house");

      // Fill in create house form with
      await page.fill("#house-name", testHouses[0].name);
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
      await page.fill('input[name="email"]', testUser1.email);
      await page.fill('input[name="password"]', testUser1.password);
      await page.click('button[type="submit"]');

      // User is redirected to the main page with a house id
      await expect(page).toHaveURL(/\/\?houseId=[\w-]+/);

      await page.goto("/house");

      // Timeout
      await page.waitForTimeout(1000);

      // Fill in create house form with
      await page.fill("#house-name", testHouses[0].name);
      await page.click("#create-house-btn");

      // Timeout
      await page.waitForTimeout(1000);

      const alertLocator = page.locator("#create-house-success");
      const alertText = await alertLocator.textContent();
      const codeMatch = alertText?.match(/[A-HJ-KLMNP-Z2-9]{8}/);
      const code = codeMatch ? codeMatch[0] : null;

      await expect(alertLocator).toContainText("House created successfully!");
      expect(code).not.toBeNull();
      if (code) testHouses[0].inviteCode = code;

      // Timeout
      await page.waitForTimeout(1000);
    });
  });

  test.describe("Register User 2", () => {
    test("A new account is created when the user provides a valid email and password", async ({
      page,
    }) => {
      await page.goto("/register");

      // Provide valid email and password
      await page.fill('input[name="name"]', testUser2.name);
      await page.fill('input[name="username"]', testUser2.username);
      await page.fill('input[name="email"]', testUser2.email);
      await page.fill('input[name="password"]', testUser2.password);
      await page.fill('input[name="confirmPassword"]', testUser2.password);
      await page.check("input#terms");
      await page.click('button[type="submit"]');

      // User is redirected to login page
      await expect(page).toHaveURL("/login");

	  await page.fill('input[name="email"]', testUser2.email);
	  await page.fill('input[name="password"]', testUser2.password);
	  await page.click('button[type="submit"]');

      // Timeout
      await page.waitForTimeout(1000);
    });
  });

  test.describe("Join house with code", () => {
    test("A new account is created when the user provides a valid email and password", async ({
      page,
    }) => {
      await page.goto("/login");

      // Fill in login form with the user created in register tests
      await page.fill('input[name="email"]', testUser2.email);
      await page.fill('input[name="password"]', testUser2.password);
      await page.click('button[type="submit"]');

      // Timeout
      await page.waitForTimeout(1000);

      // User is redirected to join house page
      await expect(page).toHaveURL("/join-house");

      // Fill in create house form with
      await page.fill("#house-code", testHouses[0].inviteCode);
      await page.click("#join-house-btn");

      // Timeout
      await page.waitForTimeout(1000);

      // User is redirected to the main page with a house id
      await expect(page).toHaveURL(/\/\?houseId=[\w-]+/);

      // Timeout
      await page.waitForTimeout(1000);
    });
  });
});
