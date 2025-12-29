"""
============================================
GEMINI PROMPT TEMPLATES
============================================

Optimized prompts for code analysis with Gemini 1.5 Flash.
"""

# ============================================
# CODE ANALYSIS PROMPT
# ============================================

CODE_ANALYSIS_PROMPT = """You are an expert code reviewer and software engineer. Analyze the following code changes and provide a comprehensive analysis.

## Commit Information
- **SHA:** {commit_sha}
- **Message:** {commit_message}
- **Author:** {author_name}
- **Files Changed:** {files_changed}
- **Total Additions:** {total_additions}
- **Total Deletions:** {total_deletions}

## Code Changes (Diffs)
{code_diffs}

---

## Your Analysis Task

Provide a detailed analysis in the following JSON format:

```json
{{
  "summary": "A 2-3 sentence summary of what these changes accomplish",
  "changes_overview": "High-level description of the changes made",
  "technical_breakdown": [
    {{
      "file": "filename",
      "changes": "What was changed in this file",
      "impact": "The impact of these changes"
    }}
  ],
  "risk_analysis": {{
    "level": "low|medium|high|critical",
    "score": 0-100,
    "factors": [
      {{
        "factor": "Risk factor name",
        "description": "Description of the risk",
        "severity": "low|medium|high"
      }}
    ]
  }},
  "bug_probability": {{
    "score": 0-100,
    "issues": [
      {{
        "type": "Issue type (e.g., null pointer, race condition)",
        "description": "Description of potential bug",
        "location": "File and approximate location",
        "suggestion": "How to fix it"
      }}
    ]
  }},
  "improvements": [
    {{
      "category": "performance|security|readability|maintainability|testing|documentation|other",
      "suggestion": "Specific improvement suggestion",
      "priority": "low|medium|high",
      "code_snippet": "Optional code example"
    }}
  ],
  "productivity": {{
    "complexity": "trivial|simple|moderate|complex|very-complex",
    "review_time": 5,
    "quality_score": 0-100,
    "comments": "Additional productivity insights"
  }}
}}
```

## Guidelines for Analysis:

1. **Risk Assessment:**
   - Low (0-25): Minor changes, well-tested areas, low impact
   - Medium (26-50): Moderate changes, some testing needed
   - High (51-75): Significant changes, critical paths affected
   - Critical (76-100): Major changes to core functionality, security concerns

2. **Bug Probability:**
   - Look for: null/undefined handling, edge cases, race conditions, memory leaks
   - Consider: error handling, input validation, type safety

3. **Code Quality:**
   - Evaluate: readability, maintainability, DRY principles, proper naming
   - Check: documentation, comments, code organization

4. **Improvements:**
   - Be specific and actionable
   - Prioritize based on impact and effort

Respond ONLY with the JSON object, no additional text.
"""


# ============================================
# DAILY REPORT GENERATION PROMPT
# ============================================

DAILY_REPORT_PROMPT = """You are a technical report writer creating a daily development report.

## Project Information
- **Project:** {project_name}
- **Repository:** {repo}
- **Date Range:** {date_start} to {date_end}

## Today's Activity Summary
- **Total Commits:** {total_commits}
- **Total Files Changed:** {total_files}
- **Total Additions:** {total_additions}
- **Total Deletions:** {total_deletions}
- **Contributors:** {contributors}

## Commits and Analyses
{commits_data}

## Risk Summary
- **Average Risk Score:** {avg_risk_score}
- **High Risk Commits:** {high_risk_count}

---

Generate a comprehensive daily report in JSON format:

```json
{{
  "executive_summary": "A 3-4 sentence executive summary of today's development activity",
  "highlights": [
    "Key positive achievement or milestone",
    "Another highlight"
  ],
  "concerns": [
    "Any concern or issue to address",
    "Another concern if applicable"
  ],
  "trends": [
    "Observable trend in the codebase",
    "Another trend"
  ],
  "recommendations": [
    "Actionable recommendation for the team",
    "Another recommendation"
  ],
  "focus_areas": [
    "Area that needs attention",
    "Another focus area"
  ]
}}
```

## Guidelines:

1. **Executive Summary:** Should be suitable for non-technical stakeholders
2. **Highlights:** Focus on accomplishments and positive changes
3. **Concerns:** Be constructive, not critical
4. **Trends:** Look for patterns in code quality, productivity, risk levels
5. **Recommendations:** Be specific and actionable
6. **Focus Areas:** Prioritize based on risk and impact

Respond ONLY with the JSON object.
"""


# ============================================
# PRODUCTIVITY INSIGHTS PROMPT
# ============================================

PRODUCTIVITY_INSIGHTS_PROMPT = """Analyze the following development metrics and provide productivity insights.

## Weekly Metrics
- **Total Commits:** {total_commits}
- **Average Commits per Day:** {avg_commits_per_day}
- **Total Lines Changed:** {total_lines}
- **Active Contributors:** {contributors}
- **Average Risk Score:** {avg_risk}
- **Average Code Quality:** {avg_quality}

## Commit Distribution
{commit_distribution}

## File Types Changed
{file_types}

---

Provide productivity analysis in JSON format:

```json
{{
  "productivity_score": 0-100,
  "velocity_trend": "increasing|stable|decreasing",
  "code_health": "excellent|good|fair|needs-attention",
  "team_insights": [
    "Insight about team productivity",
    "Another insight"
  ],
  "bottlenecks": [
    "Potential bottleneck or slowdown",
    "Another bottleneck"
  ],
  "recommendations": [
    "Recommendation to improve productivity",
    "Another recommendation"
  ],
  "achievements": [
    "Notable achievement this period",
    "Another achievement"
  ]
}}
```

Be data-driven and specific in your analysis. Respond ONLY with JSON.
"""


# ============================================
# SECURITY ANALYSIS PROMPT
# ============================================

SECURITY_ANALYSIS_PROMPT = """You are a security expert. Analyze the following code changes for security vulnerabilities.

## Code Changes
{code_diffs}

---

Provide security analysis in JSON format:

```json
{{
  "security_score": 0-100,
  "vulnerabilities": [
    {{
      "type": "OWASP category or vulnerability type",
      "severity": "low|medium|high|critical",
      "description": "Description of the vulnerability",
      "location": "File and location",
      "remediation": "How to fix it"
    }}
  ],
  "secure_practices": [
    "Good security practice observed"
  ],
  "recommendations": [
    "Security improvement recommendation"
  ]
}}
```

Look for:
- SQL injection, XSS, CSRF vulnerabilities
- Hardcoded secrets or credentials
- Insecure data handling
- Authentication/authorization issues
- Input validation problems
- Cryptographic issues

Respond ONLY with JSON.
"""
