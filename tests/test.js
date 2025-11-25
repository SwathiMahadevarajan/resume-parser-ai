import { parseResume } from '../src/index.js';
import { extractText } from '../src/parsers/textExtractor.js';
import path from 'path';
import fs from 'fs/promises';

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test 1: Check environment setup
 */
async function testEnvironmentSetup() {
  log('\n📋 Test 1: Environment Setup', 'blue');
  log('━'.repeat(50), 'blue');
  
  const apiToken = process.env.HUGGINGFACE_API_TOKEN;
  
  if (!apiToken) {
    log('❌ FAIL: HUGGINGFACE_API_TOKEN not found in environment', 'red');
    log('   Please set it in .env file', 'yellow');
    return false;
  }
  
  if (apiToken === 'your_token_here') {
    log('❌ FAIL: Please replace placeholder token with real token', 'red');
    return false;
  }
  
  log('✅ PASS: API token found', 'green');
  log(`   Token: ${apiToken.substring(0, 10)}...`, 'cyan');
  return true;
}

/**
 * Test 2: Check test files exist
 */
async function testFilesExist() {
  log('\n📋 Test 2: Test Files Availability', 'blue');
  log('━'.repeat(50), 'blue');
  
  const testDir = path.join(process.cwd(), 'tests', 'sample-resumes');
  
  try {
    await fs.access(testDir);
    const files = await fs.readdir(testDir);
    
    if (files.length === 0) {
      log('⚠️  WARNING: No test files found in tests/sample-resumes/', 'yellow');
      log('   Please add sample resume files (PDF, DOCX, or TXT)', 'yellow');
      return { success: false, files: [] };
    }
    
    log('✅ PASS: Test files found', 'green');
    files.forEach(file => log(`   - ${file}`, 'cyan'));
    return { success: true, files };
  } catch (error) {
    log('⚠️  WARNING: tests/sample-resumes/ directory not found', 'yellow');
    log('   Creating directory...', 'yellow');
    
    try {
      await fs.mkdir(testDir, { recursive: true });
      log('✅ Directory created. Please add sample resume files.', 'green');
    } catch (err) {
      log(`❌ FAIL: Could not create directory: ${err.message}`, 'red');
    }
    
    return { success: false, files: [] };
  }
}

/**
 * Test 3: Test text extraction
 */
async function testTextExtraction(files) {
  log('\n📋 Test 3: Text Extraction', 'blue');
  log('━'.repeat(50), 'blue');
  
  if (files.length === 0) {
    log('⚠️  SKIP: No files to test', 'yellow');
    return false;
  }
  
  let allPassed = true;
  
  for (const file of files) {
    const filePath = path.join(process.cwd(), 'tests', 'sample-resumes', file);
    
    try {
      log(`\n   Testing: ${file}`, 'cyan');
      const text = await extractText(filePath);
      
      if (!text || text.trim().length === 0) {
        log(`   ❌ FAIL: No text extracted`, 'red');
        allPassed = false;
      } else {
        log(`   ✅ PASS: Extracted ${text.length} characters`, 'green');
        log(`   Preview: ${text.substring(0, 100)}...`, 'cyan');
      }
    } catch (error) {
      log(`   ❌ FAIL: ${error.message}`, 'red');
      allPassed = false;
    }
  }
  
  return allPassed;
}

/**
 * Test 4: Test full resume parsing
 */
async function testResumeParsing(files) {
  log('\n📋 Test 4: Full Resume Parsing', 'blue');
  log('━'.repeat(50), 'blue');
  
  if (files.length === 0) {
    log('⚠️  SKIP: No files to test', 'yellow');
    return false;
  }
  
  // Test with first file only to save API calls
  const file = files[0];
  const filePath = path.join(process.cwd(), 'tests', 'sample-resumes', file);
  
  try {
    log(`\n   Parsing: ${file}`, 'cyan');
    log('   This may take 30-60 seconds...', 'yellow');
    
    const result = await parseResume(filePath);
    
    if (!result.success) {
      log(`   ❌ FAIL: ${result.error}`, 'red');
      return false;
    }
    
    log('   ✅ PASS: Resume parsed successfully', 'green');
    log('\n   Extracted Data:', 'cyan');
    log(JSON.stringify(result.data, null, 2), 'cyan');
    
    // Validate structure
    const hasPersonal = result.data.personal && Object.keys(result.data.personal).length > 0;
    const hasExperience = result.data.experience && result.data.experience.length > 0;
    const hasEducation = result.data.education && result.data.education.length > 0;
    const hasSkills = result.data.skills && result.data.skills.length > 0;
    
    log('\n   Data Quality:', 'cyan');
    log(`   - Personal Info: ${hasPersonal ? '✅' : '⚠️ '}`, hasPersonal ? 'green' : 'yellow');
    log(`   - Experience: ${hasExperience ? '✅' : '⚠️ '}`, hasExperience ? 'green' : 'yellow');
    log(`   - Education: ${hasEducation ? '✅' : '⚠️ '}`, hasEducation ? 'green' : 'yellow');
    log(`   - Skills: ${hasSkills ? '✅' : '⚠️ '}`, hasSkills ? 'green' : 'yellow');
    
    return true;
  } catch (error) {
    log(`   ❌ FAIL: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 5: Test error handling
 */

async function testErrorHandling() {
  log('\n📋 Test 5: Error Handling', 'blue');
  log('━'.repeat(50), 'blue');
  
  // Test with non-existent file
  try {
    log('\n   Testing with non-existent file...', 'cyan');
    const result = await parseResume('./non-existent-file.pdf');
    
    if (!result.success && result.error) {
      log('   ✅ PASS: Error handled gracefully', 'green');
      
      // Check error structure
      const errorMessage = result.error.message || JSON.stringify(result.error);
      log(`   Error type: ${result.error.type || 'N/A'}`, 'cyan');
      log(`   Error message: ${errorMessage}`, 'cyan');
    } else {
      log('   ❌ FAIL: Should have returned error', 'red');
      return false;
    }
  } catch (error) {
    log('   ❌ FAIL: Unhandled exception thrown', 'red');
    log(`   Exception: ${error.message}`, 'red');
    return false;
  }
  
  // Test with invalid file type
  try {
    log('\n   Testing with invalid file type...', 'cyan');
    
    // Create temporary invalid file
    const tempFile = path.join(process.cwd(), 'temp-test.xyz');
    await fs.writeFile(tempFile, 'test content');
    
    const result = await parseResume(tempFile);
    
    // Clean up
    await fs.unlink(tempFile);
    
    if (!result.success && result.error) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      
      if (errorMessage.includes('Unsupported file format') || 
          (result.error.type === 'FILE_ERROR' && errorMessage.includes('.xyz'))) {
        log('   ✅ PASS: Invalid format detected', 'green');
        log(`   Error type: ${result.error.type}`, 'cyan');
        log(`   Error message: ${errorMessage}`, 'cyan');
      } else {
        log('   ❌ FAIL: Should detect unsupported format', 'red');
        log(`   Got: ${errorMessage}`, 'yellow');
        return false;
      }
    } else {
      log('   ❌ FAIL: Should have returned error', 'red');
      return false;
    }
  } catch (error) {
    log('   ❌ FAIL: Unhandled exception thrown', 'red');
    log(`   Exception: ${error.message}`, 'red');
    return false;
  }
  
  // Test with empty file
  try {
    log('\n   Testing with empty file...', 'cyan');
    
    // Create temporary empty file
    const tempFile = path.join(process.cwd(), 'temp-empty.txt');
    await fs.writeFile(tempFile, '');
    
    const result = await parseResume(tempFile);
    
    // Clean up
    await fs.unlink(tempFile);
    
    if (!result.success && result.error) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      
      if (errorMessage.includes('empty') || result.error.type === 'FILE_ERROR') {
        log('   ✅ PASS: Empty file detected', 'green');
        log(`   Error message: ${errorMessage}`, 'cyan');
      } else {
        log('   ⚠️  WARNING: Empty file not properly detected', 'yellow');
      }
    } else {
      log('   ❌ FAIL: Should have returned error for empty file', 'red');
      return false;
    }
  } catch (error) {
    log('   ❌ FAIL: Unhandled exception thrown', 'red');
    log(`   Exception: ${error.message}`, 'red');
    return false;
  }
  
  // Test with missing API key
  try {
    log('\n   Testing with missing API key...', 'cyan');
    
    // Temporarily save and clear API key
    const originalKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    
    const tempFile = path.join(process.cwd(), 'tests', 'sample-resumes', 'sample-resume.txt');
    const result = await parseResume(tempFile);
    
    // Restore API key
    process.env.GROQ_API_KEY = originalKey;
    
    if (!result.success && result.error) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      
      if (errorMessage.includes('API key') || 
          errorMessage.includes('required') || 
          result.error.type === 'CONFIG_ERROR') {
        log('   ✅ PASS: Missing API key detected', 'green');
        log(`   Error message: ${errorMessage}`, 'cyan');
      } else {
        log('   ⚠️  WARNING: API key validation not clear', 'yellow');
      }
    } else {
      log('   ❌ FAIL: Should detect missing API key', 'red');
      return false;
    }
  } catch (error) {
    log('   ❌ FAIL: Unhandled exception thrown', 'red');
    log(`   Exception: ${error.message}`, 'red');
    return false;
  }
  
  return true;
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n🧪 Resume Parser AI - Test Suite', 'blue');
  log('═'.repeat(50), 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };
  
  try {
    // Test 1: Environment
    const envTest = await testEnvironmentSetup();
    if (!envTest) {
      results.failed++;
      log('\n❌ Tests aborted: Please fix environment setup', 'red');
      return;
    }
    results.passed++;
    
    // Test 2: Files
    const filesTest = await testFilesExist();
    if (!filesTest.success) {
      results.skipped++;
    } else {
      results.passed++;
    }
    
    // Test 3: Text extraction
    if (filesTest.files.length > 0) {
      const extractTest = await testTextExtraction(filesTest.files);
      extractTest ? results.passed++ : results.failed++;
    } else {
      results.skipped++;
    }
    
    // Test 4: Parsing (only if files exist and extraction works)
    if (filesTest.files.length > 0) {
      const parseTest = await testResumeParsing(filesTest.files);
      parseTest ? results.passed++ : results.failed++;
    } else {
      results.skipped++;
    }
    
    // Test 5: Error handling
    const errorTest = await testErrorHandling();
    errorTest ? results.passed++ : results.failed++;
    
  } catch (error) {
    log(`\n💥 Unexpected error: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');
    results.failed++;
  }
  
  // Summary
  log('\n📊 Test Results', 'blue');
  log('═'.repeat(50), 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`⚠️  Skipped: ${results.skipped}`, results.skipped > 0 ? 'yellow' : 'reset');
  
  if (results.failed === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
  }
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  log(`Stack: ${error.stack}`, 'red');
  process.exit(1);
});


// Run tests
runTests().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
