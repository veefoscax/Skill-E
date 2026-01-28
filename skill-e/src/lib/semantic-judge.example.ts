/**
 * Semantic Judge - Usage Examples
 * 
 * Demonstrates how to use the semantic validation system
 * to assess skill quality.
 */

import {
  validateSkillSemantics,
  getGrade,
  getScoreColor,
  getScoreLabel,
  formatValidationResultMarkdown,
  type SemanticValidationResult,
  type SemanticValidationOptions,
} from './semantic-judge';

/**
 * Example 1: Basic validation with default settings
 * 
 * Uses OpenRouter free tier (no API key needed)
 */
export async function example1_BasicValidation() {
  const taskGoal = `
    Create a new GitHub repository with a README file.
    The repository should be public and include a license.
  `;
  
  const generatedSkill = `
---
name: create-github-repo
description: Create a new GitHub repository with README and license
compatibility: GitHub Web
license: Apache-2.0
---

# Create GitHub Repository

Create a new public GitHub repository with README and license.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`{repo_name}\` | text | yes | Name of the repository |
| \`{description}\` | text | yes | Repository description |
| \`{license}\` | selection | yes | License type (MIT, Apache-2.0, GPL-3.0) |

## When to Use

- When you need to create a new GitHub repository
- When starting a new project

## Prerequisites

- Logged into GitHub
- On GitHub homepage

## Instructions

### Step 1: Navigate to New Repository

1. Click the "+" icon in the top-right corner
2. Select "New repository"

### Step 2: Configure Repository

1. Enter \`{repo_name}\` in the "Repository name" field
2. Enter \`{description}\` in the "Description" field
3. Select "Public" visibility
4. Check "Add a README file"
5. Select \`{license}\` from the "Choose a license" dropdown

**PAUSE**: Review the settings before creating

### Step 3: Create Repository

1. Click "Create repository" button
2. Wait for repository to be created

## Verification

- [ ] Repository appears in your repositories list
- [ ] README.md file exists
- [ ] License file exists
- [ ] Repository is public

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Repository name already exists | Choose a different name |
| License not available | Select from available licenses |
  `;
  
  console.log('🔍 Validating skill with default settings...\n');
  
  const result = await validateSkillSemantics(taskGoal, generatedSkill);
  
  console.log(`📊 Overall Score: ${result.score}/100 (${getGrade(result.score)})`);
  console.log(`🎨 Color: ${getScoreColor(result.score)}`);
  console.log(`📝 Label: ${getScoreLabel(result.score)}`);
  console.log(`✅ Verified: ${result.isVerified ? 'Yes' : 'No'}\n`);
  
  console.log('📈 Dimension Scores:');
  console.log(`  - Safety: ${result.dimensions.safety}/100`);
  console.log(`  - Clarity: ${result.dimensions.clarity}/100`);
  console.log(`  - Completeness: ${result.dimensions.completeness}/100\n`);
  
  console.log('💪 Strengths:');
  result.strengths.forEach(s => console.log(`  - ${s}`));
  
  console.log('\n⚠️  Weaknesses:');
  result.weaknesses.forEach(w => console.log(`  - ${w}`));
  
  console.log('\n💡 Recommendations:');
  result.recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  
  return result;
}

/**
 * Example 2: Validation with custom provider (Anthropic)
 * 
 * Uses Claude for more sophisticated critique
 */
export async function example2_CustomProvider() {
  const taskGoal = 'Delete all files in a folder';
  
  const generatedSkill = `
---
name: delete-folder-files
description: Delete all files in a folder
---

# Delete Folder Files

Delete all files in a folder.

## Instructions

1. Open the folder
2. Select all files
3. Press Delete
4. Confirm deletion
  `;
  
  console.log('🔍 Validating unsafe skill with Claude...\n');
  
  const options: SemanticValidationOptions = {
    providerConfig: {
      type: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key-here',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
      maxTokens: 2000,
    },
  };
  
  const result = await validateSkillSemantics(taskGoal, generatedSkill, options);
  
  console.log(`📊 Overall Score: ${result.score}/100 (${getGrade(result.score)})`);
  console.log(`⚠️  This skill should have a LOW safety score!\n`);
  
  console.log('📈 Dimension Scores:');
  console.log(`  - Safety: ${result.dimensions.safety}/100 (Expected: Low)`);
  console.log(`  - Clarity: ${result.dimensions.clarity}/100`);
  console.log(`  - Completeness: ${result.dimensions.completeness}/100\n`);
  
  return result;
}

/**
 * Example 3: Custom weights (prioritize safety)
 * 
 * Useful for skills that involve destructive actions
 */
export async function example3_CustomWeights() {
  const taskGoal = 'Deploy application to production';
  
  const generatedSkill = `
---
name: deploy-to-production
description: Deploy application to production environment
---

# Deploy to Production

Deploy the application to production.

## Instructions

1. Run \`npm run build\`
2. Run \`npm run deploy\`
3. Check deployment status
  `;
  
  console.log('🔍 Validating deployment skill with safety-focused weights...\n');
  
  const options: SemanticValidationOptions = {
    weights: {
      safety: 0.6,      // 60% - Very important for production deployments
      clarity: 0.25,    // 25%
      completeness: 0.15, // 15%
    },
  };
  
  const result = await validateSkillSemantics(taskGoal, generatedSkill, options);
  
  console.log(`📊 Overall Score: ${result.score}/100`);
  console.log(`⚠️  Safety is weighted at 60% for this skill\n`);
  
  console.log('📈 Dimension Scores:');
  console.log(`  - Safety: ${result.dimensions.safety}/100 (Weight: 60%)`);
  console.log(`  - Clarity: ${result.dimensions.clarity}/100 (Weight: 25%)`);
  console.log(`  - Completeness: ${result.dimensions.completeness}/100 (Weight: 15%)\n`);
  
  return result;
}

/**
 * Example 4: Format result as markdown for display
 * 
 * Useful for showing results in UI or saving to file
 */
export async function example4_FormatMarkdown() {
  const taskGoal = 'Send an email';
  
  const generatedSkill = `
---
name: send-email
description: Send an email using Gmail
---

# Send Email

Send an email using Gmail web interface.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`{recipient}\` | email | yes | Email address of recipient |
| \`{subject}\` | text | yes | Email subject |
| \`{body}\` | text | yes | Email body content |

## Instructions

### Step 1: Compose Email

1. Click "Compose" button
2. Enter \`{recipient}\` in "To" field
3. Enter \`{subject}\` in "Subject" field
4. Enter \`{body}\` in message body

### Step 2: Send Email

**PAUSE**: Review email before sending

1. Click "Send" button
2. Wait for confirmation

## Verification

- [ ] Email appears in "Sent" folder
- [ ] Confirmation message displayed
  `;
  
  console.log('🔍 Validating email skill and formatting result...\n');
  
  const result = await validateSkillSemantics(taskGoal, generatedSkill);
  
  const markdown = formatValidationResultMarkdown(result);
  
  console.log('📄 Formatted Markdown Report:\n');
  console.log(markdown);
  
  return { result, markdown };
}

/**
 * Example 5: Batch validation of multiple skills
 * 
 * Useful for comparing different skill versions
 */
export async function example5_BatchValidation() {
  const taskGoal = 'Login to website';
  
  const skills = [
    {
      name: 'Version 1 (Basic)',
      content: `
---
name: login-v1
description: Login to website
---

# Login

1. Enter username
2. Enter password
3. Click login
      `,
    },
    {
      name: 'Version 2 (Better)',
      content: `
---
name: login-v2
description: Login to website with validation
---

# Login to Website

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`{username}\` | text | yes | Your username |
| \`{password}\` | password | yes | Your password |

## Instructions

1. Enter \`{username}\` in username field
2. Enter \`{password}\` in password field
3. Click "Login" button
4. Wait for redirect

## Verification

- [ ] Successfully redirected to dashboard
      `,
    },
    {
      name: 'Version 3 (Best)',
      content: `
---
name: login-v3
description: Secure login to website with error handling
---

# Login to Website

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`{username}\` | text | yes | Your username |
| \`{password}\` | password | yes | Your password |

## Prerequisites

- On login page
- Have valid credentials

## Instructions

### Step 1: Enter Credentials

1. Enter \`{username}\` in username field
2. Enter \`{password}\` in password field

> **Note**: Password is masked for security

### Step 2: Submit Login

**PAUSE**: Verify credentials are correct

1. Click "Login" button
2. Wait for response

### Step 3: Handle Result

**If login successful:**
- Verify redirect to dashboard
- Confirm user menu shows your name

**If login fails:**
- Check error message
- Verify credentials
- Retry with correct credentials

## Verification

- [ ] Successfully logged in
- [ ] Dashboard is displayed
- [ ] User menu shows correct username

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Invalid credentials | Verify username and password |
| Account locked | Contact support |
| Page not loading | Check internet connection |
      `,
    },
  ];
  
  console.log('🔍 Comparing multiple skill versions...\n');
  
  const results = [];
  
  for (const skill of skills) {
    console.log(`\n📝 Validating: ${skill.name}`);
    const result = await validateSkillSemantics(taskGoal, skill.content);
    
    console.log(`   Score: ${result.score}/100 (${getGrade(result.score)})`);
    console.log(`   Safety: ${result.dimensions.safety}/100`);
    console.log(`   Clarity: ${result.dimensions.clarity}/100`);
    console.log(`   Completeness: ${result.dimensions.completeness}/100`);
    console.log(`   Verified: ${result.isVerified ? '✅' : '❌'}`);
    
    results.push({ name: skill.name, result });
  }
  
  console.log('\n\n📊 Summary:');
  console.log('─'.repeat(60));
  results.forEach(({ name, result }) => {
    console.log(`${name.padEnd(25)} ${result.score}/100 ${result.isVerified ? '✅' : '❌'}`);
  });
  
  return results;
}

/**
 * Example 6: Integration with skill generation workflow
 * 
 * Shows how to use semantic validation after generating a skill
 */
export async function example6_IntegrationWorkflow() {
  console.log('🔄 Simulating full workflow: Generate → Validate → Improve\n');
  
  // Step 1: User records demonstration
  console.log('1️⃣ User records demonstration...');
  const taskGoal = 'Create a new document in Google Docs';
  
  // Step 2: System generates skill (simulated)
  console.log('2️⃣ Generating skill from recording...');
  const generatedSkill = `
---
name: create-google-doc
description: Create a new Google Docs document
---

# Create Google Doc

Create a new document in Google Docs.

## Instructions

1. Go to Google Docs
2. Click "Blank" to create new document
3. Start typing
  `;
  
  // Step 3: Validate the generated skill
  console.log('3️⃣ Validating generated skill...\n');
  const result = await validateSkillSemantics(taskGoal, generatedSkill);
  
  console.log(`📊 Quality Score: ${result.score}/100`);
  console.log(`✅ Verified: ${result.isVerified ? 'Yes' : 'No'}\n`);
  
  // Step 4: Show feedback to user
  if (!result.isVerified) {
    console.log('⚠️  Skill needs improvement:\n');
    
    console.log('Weaknesses:');
    result.weaknesses.forEach(w => console.log(`  - ${w}`));
    
    console.log('\nRecommendations:');
    result.recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
    
    console.log('\n💡 User can now:');
    console.log('  - Edit the skill manually');
    console.log('  - Re-record with more detail');
    console.log('  - Accept as-is if good enough');
  } else {
    console.log('✅ Skill is production-ready!');
    console.log('   User can save and use immediately.');
  }
  
  return result;
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Semantic Judge Examples\n');
  console.log('═'.repeat(60));
  
  // Uncomment to run specific examples:
  
  // await example1_BasicValidation();
  // await example2_CustomProvider();
  // await example3_CustomWeights();
  // await example4_FormatMarkdown();
  // await example5_BatchValidation();
  // await example6_IntegrationWorkflow();
}
