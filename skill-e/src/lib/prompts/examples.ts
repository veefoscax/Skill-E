/**
 * Few-Shot Examples for Skill Generation
 * 
 * These examples follow the "Tool to X. Use when Y." pattern
 * and demonstrate best practices for SKILL.md creation.
 * 
 * Research shows that 2-3 well-chosen examples can reduce
 * errors by up to 10x compared to zero-shot prompting.
 */

import type { FewShotExample } from './types';

/**
 * Example 1: Simple Login Task (Minimal Template)
 * Demonstrates basic skill with variables
 */
export const simpleLoginExample: FewShotExample = {
  name: 'simple-login',
  description: 'Basic login workflow with username/password variables',
  input: {
    taskGoal: 'Login to the admin dashboard',
    steps: [
      'Navigate to login page',
      'Enter username in username field',
      'Enter password in password field',
      'Click login button',
      'Wait for dashboard to load'
    ],
    variables: ['username', 'password']
  },
  output: `---
name: dashboard-login
description: "Login to admin dashboard with credentials. Use when user asks to 'login', 'sign in', 'access dashboard', or 'authenticate'."
---

# Dashboard Login

Automated login to the admin dashboard.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| {username} | text | yes | Admin username or email |
| {password} | password | yes | Admin password (never logged) |

## When to Use

- Accessing admin dashboard
- Starting authenticated session
- Before any admin operations

## Prerequisites

- Valid admin credentials
- Dashboard URL accessible
- 2FA device if enabled

## Instructions

### Step 1: Navigate to Login

1. Open browser at https://admin.example.com
2. Verify login form is visible

### Step 2: Enter Credentials

1. Click username field
2. Type: {username}
3. Click password field
4. Type: {password}

> **Note**: Password is masked and never stored in logs.

### Step 3: Submit Login

1. Click "Sign In" button
2. Wait for dashboard to load (max 10s)
3. Verify "Welcome" message appears

## Verification

- [ ] Dashboard loads successfully
- [ ] User avatar/name visible in header
- [ ] No error messages displayed

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid credentials" | Check username/password spelling |
| "Account locked" | Contact admin to unlock account |
| 2FA prompt | Enter code from authenticator app |

## What This Covers

- Username/password authentication
- Standard login flow
- Error handling for common cases

## What This Does NOT Cover

- SSO/OAuth login (use sso-login skill)
- Password reset (use password-reset skill)
- API token auth (use api-authentication skill)

## Never Do

- [ ] Never hardcode credentials
- [ ] Never share password in chat
- [ ] Never disable 2FA`
};

/**
 * Example 2: Complex API Integration (Standard Template)
 * Demonstrates conditionals, multiple paths, detailed instructions
 */
export const apiIntegrationExample: FewShotExample = {
  name: 'api-integration',
  description: 'Complex API integration with conditional paths and error handling',
  input: {
    taskGoal: 'Export data via REST API with pagination and rate limiting',
    steps: [
      'Check API rate limit status',
      'If rate limited, wait and retry',
      'Make initial API request',
      'Check if pagination needed',
      'If has more pages, loop through all pages',
      'Save data to file',
      'Verify export completed'
    ],
    variables: ['api_key', 'endpoint', 'output_format']
  },
  output: `---
name: api-data-export
description: "Export data from REST API with automatic pagination and rate limit handling. Use when user asks to 'export data', 'fetch from API', 'download records', or 'API integration'."
---

# API Data Export

Export data from REST APIs with automatic pagination, rate limiting, and retry logic.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| {api_key} | string | yes | API authentication key |
| {endpoint} | string | yes | API endpoint URL |
| {output_format} | selection | yes | Export format: json, csv, or xlsx |

## When to Use

- Bulk data export from APIs
- Automated data synchronization
- Scheduled data pulls

## Prerequisites

- Valid API key with read permissions
- API endpoint accessible
- Sufficient rate limit quota

## Instructions

### Step 1: Check Rate Limit

1. Call GET /rate-limit endpoint
2. Parse response headers:
   - X-RateLimit-Remaining
   - X-RateLimit-Reset

**If rate limit exceeded:**
1. Calculate wait time from X-RateLimit-Reset
2. Wait until rate limit resets
3. Log: "Rate limited, waiting {X}s"

### Step 2: Initial Request

1. Set headers:
   - Authorization: Bearer {api_key}
   - Accept: application/json
2. Call GET {endpoint}
3. Save response to variable data

### Step 3: Handle Pagination

**If response contains has_more: true:**
1. Extract next_cursor from response
2. Loop:
   a. Call GET {endpoint}?cursor={next_cursor}
   b. Append results to data
   c. Update next_cursor
   d. If no more pages, break

**If single page only:**
- Continue to Step 4

### Step 4: Export Data

**If {output_format} = json:**
1. Save as export.json
2. Validate JSON structure

**If {output_format} = csv:**
1. Convert JSON to CSV
2. Save as export.csv

**If {output_format} = xlsx:**
1. Create Excel workbook
2. Add data to first sheet
3. Save as export.xlsx

### Step 5: Verify Export

1. Check file exists
2. Verify file size > 0
3. Validate data format

## Verification

- [ ] All pages fetched (check total_count matches)
- [ ] Output file created successfully
- [ ] Data format is valid
- [ ] No API errors in logs

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Check API key is valid and not expired |
| 429 Rate Limited | Increase retry delay; implement exponential backoff |
| Timeout | Increase request timeout; check network connectivity |
| Incomplete data | Verify pagination logic; check cursor handling |

## What This Covers

- REST API authentication
- Automatic pagination
- Rate limit handling
- Multiple output formats
- Retry logic

## What This Does NOT Cover

- GraphQL APIs (use graphql-export skill)
- WebSocket streaming (use websocket-client skill)
- Real-time sync (use webhook-integration skill)

## Never Do

- [ ] Never expose API key in logs
- [ ] Never ignore rate limits
- [ ] Never skip data validation`
};

/**
 * Example 3: File Processing (Complex Template)
 * Demonstrates file operations, error handling, guardrails
 */
export const fileProcessingExample: FewShotExample = {
  name: 'file-processing',
  description: 'File processing workflow with validation and error handling',
  input: {
    taskGoal: 'Process CSV file, validate data, and generate report',
    steps: [
      'Read input CSV file',
      'Validate CSV structure',
      'If validation fails, show errors and exit',
      'Process each row',
      'Generate summary report',
      'Save report to output folder'
    ],
    variables: ['input_file', 'output_folder', 'report_format']
  },
  output: `---
name: csv-report-generator
description: "Process CSV files, validate data, and generate formatted reports. Use when user asks to 'process CSV', 'generate report', 'validate data', or 'file analysis'."
---

# CSV Report Generator

Process CSV files with automatic validation, error reporting, and formatted output generation.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| {input_file} | file | yes | Path to input CSV file |
| {output_folder} | folder | yes | Directory for output reports |
| {report_format} | selection | yes | Output format: summary, detailed, or json |

## When to Use

- Monthly data processing
- Import validation before database load
- Data quality reports

## Prerequisites

- Input file must exist and be readable
- Output folder must be writable
- CSV must have header row

## Instructions

### Step 1: Read and Validate

1. Open {input_file}
2. Check file is not empty (> 0 bytes)
3. Detect encoding (UTF-8, ISO-8859-1)
4. Parse header row

**If validation fails:**
1. Log all errors to validation-report.txt
2. Show first 5 errors to user
3. STOP - Do not proceed

### Step 2: Validate Structure

1. Check required columns exist:
   - id (unique identifier)
   - name (string)
   - value (number)
2. Validate data types per row
3. Check for duplicate IDs

**If structure errors found:**
- Report: "Found {N} validation errors"
- Save detailed error log to {output_folder}/errors.log

### Step 3: Process Data

1. Initialize counters:
   - total_rows = 0
   - valid_rows = 0
   - error_rows = 0

2. For each row in CSV:
   a. Increment total_rows
   b. Validate row data
   c. If valid: process and increment valid_rows
   d. Else: log error and increment error_rows

### Step 4: Generate Report

**If {report_format} = summary:**
Generate text summary:
- Total rows processed: {total_rows}
- Valid rows: {valid_rows}
- Errors: {error_rows}
- Success rate: {percentage}%

**If {report_format} = detailed:**
- Include summary statistics
- Add error breakdown by type
- List sample of valid records
- Attach full error log

**If {report_format} = json:**
- Generate machine-readable JSON
- Include metadata and statistics
- Structure for automated processing

### Step 5: Save Output

1. Create report file: {output_folder}/report.{format}
2. Write generated content
3. Verify file saved successfully

## Verification

- [ ] Input file validated
- [ ] All rows processed
- [ ] Report file created
- [ ] Error count is expected
- [ ] Output is readable

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "File not found" | Check path is absolute or relative to working directory |
| "Permission denied" | Verify write access to output folder |
| "Encoding error" | Try converting file to UTF-8 first |
| "Out of memory" | Process file in chunks; use streaming parser |

## What This Covers

- CSV validation
- Data type checking
- Error reporting
- Multiple report formats
- Batch processing

## What This Does NOT Cover

- Database import (use db-import skill)
- Real-time streaming (use stream-processor skill)
- Excel files (use excel-processor skill)

## Never Do

- [ ] Never modify original input file
- [ ] Never ignore validation errors
- [ ] Never output to same folder as input without backup`
};

/**
 * All available examples
 */
export const allExamples: FewShotExample[] = [
  simpleLoginExample,
  apiIntegrationExample,
  fileProcessingExample
];

/**
 * Get examples by task complexity
 */
export function getExamplesByComplexity(
  stepCount: number,
  variableCount: number
): FewShotExample[] {
  if (stepCount <= 3 && variableCount <= 2) {
    // Simple task - use login example
    return [simpleLoginExample];
  } else if (stepCount <= 6 && variableCount <= 4) {
    // Medium complexity - use API example
    return [apiIntegrationExample];
  } else {
    // Complex task - use all examples
    return allExamples;
  }
}

/**
 * Get examples by template type
 */
export function getExamplesByTemplate(
  templateType: 'minimal' | 'standard' | 'complex'
): FewShotExample[] {
  switch (templateType) {
    case 'minimal':
      return [simpleLoginExample];
    case 'standard':
      return [simpleLoginExample, apiIntegrationExample];
    case 'complex':
      return allExamples;
    default:
      return [simpleLoginExample];
  }
}
