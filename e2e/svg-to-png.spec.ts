import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('SVG to PNG Core Flow', () => {
  test('should upload an SVG, convert it, and show download options', async ({ page }) => {
    // 1. Visit the application
    await page.goto('/svg-to-png');

    // Wait for WASM to be ready (optional, but good for stability)
    // There is a WasmStatus component that shows "Ready"
    await expect(page.locator('text=Ready')).toBeVisible({ timeout: 10000 });

    // 2. Upload the test SVG file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'test-assets/test.svg'));

    // 3. Wait for the conversion to complete
    // The BatchResult component shows "Conversion Complete" when done
    await expect(page.locator('text=Conversion Complete')).toBeVisible({ timeout: 15000 });

    // 4. Verify that the converted item is displayed with its dimensions
    // Our test SVG has width 100 and height 100
    await expect(page.locator('text=test.svg')).toBeVisible();
    await expect(page.locator('text=100×100')).toBeVisible();

    // 5. Verify download buttons are available
    // Single download button
    const downloadBtn = page.locator('button[title="Download"]');
    await expect(downloadBtn).toBeVisible();

    // Zip download button
    const downloadZipBtn = page.locator('button:has-text("Download All (ZIP)")');
    await expect(downloadZipBtn).toBeVisible();

    // 6. Test URL Import functionality (Error case handling)
    // Click "Upload More" to reset
    await page.locator('button:has-text("Upload More")').click();
    
    // Verify we are back to the drop zone
    await expect(page.locator('text=Drag and drop SVG files here')).toBeVisible();
    
    // Test URL import with invalid URL to ensure error handling works
    const urlInput = page.locator('input[type="url"]');
    await urlInput.fill('http://localhost/not-an-svg');
    await page.locator('button:has-text("Import URL")').click();
    
    // Wait for the error message
    await expect(page.locator('text=For security reasons, private or local addresses are not supported')).toBeVisible({ timeout: 15000 });
  });
});