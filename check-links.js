#!/usr/bin/env node

/**
 * Broken Link Checker
 * Validates URLs in links.json and marks broken links
 * Usage: node check-links.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const linksPath = path.join(__dirname, 'public/links.json');
const TIMEOUT = 5000; // 5 second timeout per request
const MAX_RETRIES = 2;

/**
 * Check if a URL is valid and accessible
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - True if accessible, false otherwise
 */
function checkURL(url) {
  return new Promise((resolve) => {
    const checkHttps = url.startsWith('https');
    const protocol = checkHttps ? https : http;
    const timeoutId = setTimeout(() => resolve(false), TIMEOUT);

    try {
      const request = protocol.head(url, { redirect: 'follow' }, (res) => {
        clearTimeout(timeoutId);
        // Consider 2xx, 3xx, and 4xx (except 429) as potentially valid
        // Mark only 404, 410, 403 (in some cases), and 5xx+ as broken
        const status = res.statusCode;
        const isBroken = status === 404 || status === 410 || (status >= 500 && status < 600);
        resolve(!isBroken);
      });

      request.on('error', () => {
        clearTimeout(timeoutId);
        resolve(false);
      });

      request.end();
    } catch (error) {
      clearTimeout(timeoutId);
      resolve(false);
    }
  });
}

/**
 * Check a URL with retries
 * @param {string} url - The URL to check
 * @param {number} retries - Number of retries
 * @returns {Promise<boolean>} - True if accessible, false otherwise
 */
async function checkURLWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    const result = await checkURL(url);
    if (result) return true;
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
    }
  }
  return false;
}

/**
 * Main function to check all links
 */
async function checkAllLinks() {
  try {
    console.log('📋 Reading links.json...');
    const data = JSON.parse(fs.readFileSync(linksPath, 'utf8'));
    
    console.log(`\n🔍 Checking ${data.length} links...\n`);
    
    let brokenCount = 0;
    let activeCount = 0;

    // Check each link
    for (const link of data) {
      process.stdout.write(`  Checking: ${link.title.padEnd(40)} `);
      
      const isValid = await checkURLWithRetry(link.url);
      
      if (!isValid && link.status !== 'broken') {
        link.status = 'broken';
        brokenCount++;
        console.log('❌ BROKEN');
      } else if (isValid && link.status === 'broken') {
        link.status = 'active';
        activeCount++;
        console.log('✅ FIXED');
      } else {
        console.log(link.status === 'broken' ? '❌ BROKEN' : '✅ ACTIVE');
      }
    }

    // Save updated links
    console.log(`\n💾 Saving results to links.json...`);
    fs.writeFileSync(linksPath, JSON.stringify(data, null, 2));

    // Summary
    console.log('\n📊 Summary:');
    console.log(`  Total links: ${data.length}`);
    console.log(`  Active links: ${data.filter(l => l.status === 'active').length}`);
    console.log(`  Broken links: ${data.filter(l => l.status === 'broken').length}`);
    console.log(`  Status changes: ${brokenCount + activeCount}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the checker
checkAllLinks();
