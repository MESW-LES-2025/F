import { test, expect } from "@playwright/test";

const testUser = {
  name: "Chat Test User",
  username: `chatuser${Date.now()}`,
  email: `chat${Date.now()}@example.com`,
  password: "TestPassword123!",
};

const testHouse = {
  name: "Chat Test House",
};

test.describe("Chat Acceptance Tests", () => {
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

  test("Send a message", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.click('a[href="/chat"]');
    await expect(page).toHaveURL(/\/chat/);
	await page.waitForTimeout(500);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const messageContent = "Hello world";
    await page.fill('textarea[placeholder="Type a message..."]', messageContent);
    await page.click('button:has(.lucide-send)'); 

	await page.waitForTimeout(500);
    
    await expect(page.getByText(messageContent).first()).toBeVisible();
  });

  test("Reply to a message", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.click('a[href="/chat"]');
	await page.waitForTimeout(500);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const parentMessage = "Hello world";
    const replyContent = "This is a reply";
    
    // Hover over the message to reveal actions
    const messageLocator = page.locator(`div:has-text("${parentMessage}")`).last();
    await messageLocator.hover();
    
    await page.click('button:has(.lucide-reply)');
    
    await expect(page.getByText(`Replying to ${testUser.name}`)).toBeVisible();
    
    await page.fill('textarea[placeholder="Type a message..."]', replyContent);
    await page.click('button:has(.lucide-send)');

	await page.waitForTimeout(500);
    
    await expect(page.getByText(replyContent).first()).toBeVisible();
    // Verify it shows as a reply (checking for parent content preview)
    await expect(page.locator(`text=${parentMessage}`).last()).toBeVisible();
  });

  test("Edit a message", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.click('a[href="/chat"]');
	await page.waitForTimeout(500);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const oldContent = "This is a reply";
    const newContent = "This is a reply (edited)";
    
    await expect(page.getByText(oldContent).last()).toBeVisible();
    await page.locator('button:has(.lucide-ellipsis-vertical)').last().click();
    await page.click('div[role="menuitem"]:has-text("Edit")');
    
    await page.fill('input[value="' + oldContent + '"]', newContent);
    await page.click('button:has(.lucide-check)');
    
    await expect(page.getByText(newContent)).toBeVisible();
    await expect(page.getByText(oldContent)).toBeVisible();
  });

  test("Delete a message", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.click('a[href="/chat"]');
	await page.waitForTimeout(500);
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Create a message to delete
    const contentToDelete = "Delete me";
    await page.fill('textarea[placeholder="Type a message..."]', contentToDelete);
    await page.click('button:has(.lucide-send)');
	await page.waitForTimeout(500);
    await expect(page.getByText(contentToDelete)).toBeVisible();
    
    // Handle confirm dialog
    page.on('dialog', dialog => dialog.accept());
    
    await page.locator('button:has(.lucide-ellipsis-vertical)').last().click();
    await page.click('div[role="menuitem"]:has-text("Delete")');
    
    await expect(page.getByText(contentToDelete)).not.toBeVisible();
  });
});
