#!/usr/bin/env tsx
// Test runner for all Phase tests

import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running All Tests');
console.log('===================');

async function runTests() {
    const testFiles = readdirSync(__dirname)
        .filter(file => file.endsWith('.test.ts'))
        .sort();

    if (testFiles.length === 0) {
        console.log('❌ No test files found in tests directory');
        return;
    }

    console.log(`📋 Found ${testFiles.length} test file(s):`);
    testFiles.forEach(file => console.log(`  - ${file}`));
    console.log('');

    for (const testFile of testFiles) {
        console.log(`🏃 Running ${testFile}...`);
        console.log('─'.repeat(50));

        try {
            // Import and run the test
            await import(`./${testFile}`);
            console.log(`✅ ${testFile} completed`);
        } catch (error) {
            console.error(`❌ ${testFile} failed:`, error);
        }

        console.log('─'.repeat(50));
        console.log('');
    }

    console.log('🎯 All tests completed!');
}

runTests().catch(console.error); 