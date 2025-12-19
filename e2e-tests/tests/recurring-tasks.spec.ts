import { test, expect } from "@playwright/test";

const testUser = {
  name: "Recurring Test User",
  username: `recuruser_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
  email: `recur_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`,
  password: "RecurTest123!",
};

const testHouse = {
  name: `Recurring Test House ${Date.now()}`,
};

test.describe("Recurring Tasks", () => {
  test.describe.configure({ mode: "serial" });

  test("Setup: Register and Create House", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.check("input#terms");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/login");

    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);
    await page.fill("#house-name", testHouse.name);
    await page.click("#create-house-btn");

    await expect(page).toHaveURL(/\/\?houseId=[\w-]+/);
  });

  test("should create a daily recurring task", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.click('a[href="/activities"]');
    await expect(page).toHaveURL(/\/activities/);
    await page.waitForTimeout(500);

    // Click "New Task" button
    await page.click('button:has-text("New Task")');

    // Fill in task details
    await page.fill('input[name="title"]', "Daily Recurring Task");
    await page.fill('textarea[name="description"]', "This task should recur every day");

    // Select assignee (required field)
    await page.click('button:has-text("Select assignees")');
    await page.waitForTimeout(200);
    await page.click('div[role="menuitemcheckbox"]:has-text("Recurring Test User")').catch(() => 
      page.click('div[role="option"]:first-child')
    );
    await page.keyboard.press('Escape'); // Close assignee dropdown

    // Set deadline to 7 days from now
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dateString = futureDate.toISOString().split("T")[0];
    await page.fill('input[type="date"]', dateString);

    // Enable recurring task
    await page.locator('label[for="isRecurring"]').scrollIntoViewIfNeeded();
    await page.locator('label[for="isRecurring"]').click();
    
    // Wait for recurrence fields to appear and scroll dialog to show them
    await page.waitForTimeout(300);
    const patternCombobox = page.locator('button:has-text("Select pattern")');
    await patternCombobox.scrollIntoViewIfNeeded();

    // Select Daily pattern
    await patternCombobox.click();
    await page.click('div[role="option"]:has-text("Daily")');

    // Set interval to 1
    await page.fill('input[type="number"]', "1");

    // Submit the task
    await page.click('button[type="submit"]:has-text("Create Task")');

    // Wait for task to appear
    await page.waitForTimeout(1000);

    // Verify the task appears with a recurring badge
    await expect(page.locator('text="Daily Recurring Task"')).toBeVisible();
    // Verify Daily badge is shown in the task card
    await expect(page.locator('text="Daily Recurring Task"').locator('..').locator('text="Daily"')).toBeVisible();
  });

  test("should create a weekly recurring task", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.click('a[href="/activities"]');
    await page.waitForTimeout(500);

    await page.click('button:has-text("New Task")');

    await page.fill('input[name="title"]', "Weekly Recurring Task");
    await page.fill('textarea[name="description"]', "This task should recur every week");

    await page.click('button:has-text("Select assignees")');
    await page.waitForTimeout(200);
    await page.click('[role="menuitemcheckbox"]');
    await page.keyboard.press('Escape');

    const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const dateString = futureDate.toISOString().split("T")[0];
    await page.fill('input[type="date"]', dateString);

    await page.locator('label[for="isRecurring"]').scrollIntoViewIfNeeded();
    await page.locator('label[for="isRecurring"]').click();
    
    await page.waitForTimeout(300);
    const patternCombobox = page.locator('button:has-text("Select pattern")');
    await patternCombobox.scrollIntoViewIfNeeded();

    await patternCombobox.click();
    await page.click('div[role="option"]:has-text("Weekly")');

    await page.fill('input[type="number"]', "1");

    await page.click('button[type="submit"]:has-text("Create Task")');

    await page.waitForTimeout(1000);

    await expect(page.locator('text="Weekly Recurring Task"')).toBeVisible();
    await expect(page.locator('text="Weekly Recurring Task"').locator('..').locator('text="Weekly"')).toBeVisible();
  });

  test("should create a monthly recurring task with custom interval", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.click('a[href="/activities"]');
    await page.waitForTimeout(500);

    await page.click('button:has-text("New Task")');

    await page.fill('input[name="title"]', "Bi-Monthly Recurring Task");
    await page.fill('textarea[name="description"]', "This task should recur every 2 months");

    await page.click('button:has-text("Select assignees")');
    await page.waitForTimeout(200);
    await page.click('[role="menuitemcheckbox"]');
    await page.keyboard.press('Escape');

    const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const dateString = futureDate.toISOString().split("T")[0];
    await page.fill('input[type="date"]', dateString);

    await page.locator('label[for="isRecurring"]').scrollIntoViewIfNeeded();
    await page.locator('label[for="isRecurring"]').click();
    
    await page.waitForTimeout(300);
    const patternCombobox = page.locator('button:has-text("Select pattern")');
    await patternCombobox.scrollIntoViewIfNeeded();

    await patternCombobox.click();
    await page.click('div[role="option"]:has-text("Monthly")');

    await page.fill('input[type="number"]', "2");

    await page.click('button[type="submit"]:has-text("Create Task")');

    await page.waitForTimeout(1000);

    await expect(page.locator('text="Bi-Monthly Recurring Task"')).toBeVisible();
    await expect(page.locator('text="Monthly (every 2)"')).toBeVisible();
  });

  test("should stop a recurring task", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.click('a[href="/activities"]');
    await page.waitForTimeout(500);

    // Find and click the edit button on the daily recurring task card
    const taskCard = page.locator('text="Daily Recurring Task"').locator('..');
    await taskCard.locator('button').first().click();

    // Wait for edit dialog to open
    await page.waitForTimeout(500);

    // Verify recurring info is shown
    await expect(page.locator('text="This is a recurring task"')).toBeVisible();

    // Click "Stop Recurrence" button
    await page.click('button:has-text("Stop Recurrence")');

    // Wait for the action to complete
    await page.waitForTimeout(1000);

    // Verify the task no longer shows the recurring badge
    const task = page.locator('text="Daily Recurring Task"').first();
    await expect(task).toBeVisible();
    // The badge should be gone after stopping recurrence
    await expect(page.locator('.badge:has-text("Daily")').first()).not.toBeVisible();
  });
});
