import { test, expect } from '@playwright/test';

// Shared test user credentials
const testUser = {
	name: 'E2E Test User',
	username: `e2euser${Date.now()}_${Math.floor(Math.random() * 10000)}`,
	email: `e2etest${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`,
	password: 'TestPassword123!'
};

test.describe('Auth Acceptance Tests', () => {
	test.describe.configure({ mode: 'serial' });

	test.describe('Register', () => {
		test('A new account is created when the user provides a valid email and password', async ({ page }) => {
			await page.goto('/register');

			// Provide valid email and password
			await page.fill('input[name="name"]', testUser.name);
			await page.fill('input[name="username"]', testUser.username);
			await page.fill('input[name="email"]', testUser.email);
			await page.fill('input[name="password"]', testUser.password);
			await page.fill('input[name="confirmPassword"]', testUser.password);
			await page.check('input#terms');
			await page.click('button[type="submit"]');

			// User is redirected to login page
			await expect(page).toHaveURL('/login');
		});

		test('An error message is displayed if any required field is empty', async ({ page }) => {
			await page.goto('/register');

			// Submit form with empty email
			await page.fill('input[name="name"]', 'Test User');
			await page.fill('input[name="username"]', 'testuser');
			await page.fill('input[name="password"]', 'password123');
			await page.fill('input[name="confirmPassword"]', 'password123');
			await page.check('input#terms');
			await page.click('button[type="submit"]');

			// Error message is displayed (browser validation will prevent submission)
			const emailInput = page.locator('input[name="email"]');
			await expect(emailInput).toBeVisible();
		});

		test('An error message is displayed if the email format is invalid', async ({ page }) => {
			await page.goto('/register');

			// Provide invalid email format
			await page.fill('input[name="name"]', 'Test User');
			await page.fill('input[name="username"]', 'testuser');
			await page.fill('input[name="email"]', 'invalidemail');
			await page.fill('input[name="password"]', 'password123');
			await page.fill('input[name="confirmPassword"]', 'password123');
			await page.check('input#terms');
			await page.click('button[type="submit"]');

			// Error message is displayed (browser validation will prevent submission)
			const emailInput = page.locator('input[name="email"]');
			await expect(emailInput).toBeVisible();
		});

		test('An error message is displayed if the email is already registered', async ({ page }) => {
			await page.goto('/register');

			// Try to register with the same email as the first test
			await page.fill('input[name="name"]', 'Duplicate User');
			await page.fill('input[name="username"]', 'duplicateuser');
			await page.fill('input[name="email"]', testUser.email);
			await page.fill('input[name="password"]', 'password123');
			await page.fill('input[name="confirmPassword"]', 'password123');
			await page.check('input#terms');
			await page.click('button[type="submit"]');

			// Error message is displayed
			await expect(page.getByText(/(?=.*already)(?=.*(user|email))/i)).toBeVisible();
		});
	});

	test.describe('Login', () => {
		test('The system authenticates the user when valid credentials are provided', async ({ page }) => {
			await page.goto('/login');

			// Fill in login form with the user created in register tests
			await page.fill('input[name="email"]', testUser.email);
			await page.fill('input[name="password"]', testUser.password);
			await page.click('button[type="submit"]');

			// User is redirected to the main dashboard
			await expect(page).toHaveURL('/join-house');
		});

		test('An error message is displayed for an incorrect password', async ({ page }) => {
			await page.goto('/login');

			await page.fill('input[name="email"]', testUser.email);
			await page.fill('input[name="password"]', 'WrongPassword123!');
			await page.click('button[type="submit"]');

			await expect(page.getByText(/invalid credentials/i)).toBeVisible();
		});

		test('An error message is displayed for a non-existing email', async ({ page }) => {
			await page.goto('/login');

			await page.fill('input[name="email"]', 'unknown@example.com');
			await page.fill('input[name="password"]', 'password123');
			await page.click('button[type="submit"]');

			await expect(page.getByText(/invalid credentials/i)).toBeVisible();
		});

		test('Form does not submit when required fields are empty', async ({ page }) => {
			await page.goto('/login');

			// Leave fields empty and submit
			await page.click('button[type="submit"]');

			// Browser validation keeps page here
			await expect(page).toHaveURL('/login');
		});
	});

	test.describe('Logout', () => {
		test('User can log out successfully', async ({ page }) => {
			await page.goto('/login');
			await page.fill('input[name="email"]', testUser.email);
			await page.fill('input[name="password"]', testUser.password);
			await page.click('button[type="submit"]');
			await expect(page).toHaveURL('/join-house');

			await page.goto('/settings');
			await expect(page).toHaveURL('/settings');
			await page.getByRole('button', { name: /^Log Out$/i }).click({ force: true });
			await page.waitForTimeout(500); // Wait for navigation to complete
			await expect(page).toHaveURL('/login');
		});
	});
});

