"""
============================================
GEMINI AI SERVICE
============================================

Handles communication with Google's Gemini 1.5 Flash model.
"""

import json
import os
import time
from typing import Dict, Any, Optional

import google.generativeai as genai
from dotenv import load_dotenv

from ..prompts.templates import (
    CODE_ANALYSIS_PROMPT,
    DAILY_REPORT_PROMPT,
    PRODUCTIVITY_INSIGHTS_PROMPT,
    SECURITY_ANALYSIS_PROMPT
)

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Model configuration
GENERATION_CONFIG = {
    "temperature": 0.3,  # Lower temperature for more consistent outputs
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 8192,
}

# Safety settings (relaxed for code analysis)
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]


class GeminiService:
    """Service for interacting with Gemini 2.0 Flash model."""
    
    def __init__(self):
        """Initialize the Gemini model."""
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=GENERATION_CONFIG,
            safety_settings=SAFETY_SETTINGS
        )
    
    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """Parse JSON from model response, handling markdown code blocks."""
        # Remove markdown code block markers if present
        text = response_text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError as e:
            # Try to extract JSON from the response
            import re
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError(f"Failed to parse JSON response: {e}")
    
    async def analyze_code(self, commit_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze code changes using Gemini.
        
        Args:
            commit_data: Dictionary containing commit information and diffs
        
        Returns:
            Analysis results as dictionary
        """
        start_time = time.time()
        
        # Prepare code diffs string
        code_diffs = ""
        for file in commit_data.get("files", []):
            code_diffs += f"\n### {file['filename']} ({file['status']})\n"
            code_diffs += f"Additions: {file.get('additions', 0)}, Deletions: {file.get('deletions', 0)}\n"
            if file.get("patch"):
                code_diffs += f"```diff\n{file['patch']}\n```\n"
        
        # Format the prompt
        prompt = CODE_ANALYSIS_PROMPT.format(
            commit_sha=commit_data.get("commit_sha", "unknown"),
            commit_message=commit_data.get("commit_message", "No message"),
            author_name=commit_data.get("author", {}).get("name", "Unknown"),
            files_changed=len(commit_data.get("files", [])),
            total_additions=commit_data.get("stats", {}).get("totalAdditions", 0),
            total_deletions=commit_data.get("stats", {}).get("totalDeletions", 0),
            code_diffs=code_diffs or "No code diffs available"
        )
        
        try:
            # Generate analysis
            response = self.model.generate_content(prompt)
            
            # Parse the response
            result = self._parse_json_response(response.text)
            
            # Add metadata
            result["model_used"] = "gemini-1.5-flash"
            result["tokens_used"] = response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else 0
            result["processing_time_ms"] = int((time.time() - start_time) * 1000)
            
            return result
            
        except Exception as e:
            # Return a default analysis on error
            return {
                "summary": f"Analysis failed: {str(e)}",
                "changes_overview": "Unable to analyze changes",
                "technical_breakdown": [],
                "risk_analysis": {"level": "medium", "score": 50, "factors": []},
                "bug_probability": {"score": 50, "issues": []},
                "improvements": [],
                "productivity": {
                    "complexity": "moderate",
                    "review_time": 15,
                    "quality_score": 50,
                    "comments": "Analysis failed"
                },
                "model_used": "gemini-1.5-flash",
                "error": str(e)
            }
    
    async def generate_report(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a daily report summary using Gemini.
        
        Args:
            report_data: Dictionary containing aggregated commit data
        
        Returns:
            Report content as dictionary
        """
        # Format commits data
        commits_data = ""
        for commit in report_data.get("commits", []):
            commits_data += f"\n- **{commit['sha']}**: {commit['message']} "
            commits_data += f"(by {commit['author']}, {commit['files_changed']} files, "
            commits_data += f"+{commit['additions']}/-{commit['deletions']})\n"
        
        # Format analyses summary
        for analysis in report_data.get("analyses", []):
            commits_data += f"  - Risk: {analysis['risk_level']} ({analysis['risk_score']}/100)\n"
        
        # Calculate statistics
        contributors = list(set([c['author'] for c in report_data.get("commits", [])]))
        
        prompt = DAILY_REPORT_PROMPT.format(
            project_name=report_data.get("project_name", "Unknown Project"),
            repo=report_data.get("repo", "unknown/repo"),
            date_start=report_data.get("date_range", {}).get("start", ""),
            date_end=report_data.get("date_range", {}).get("end", ""),
            total_commits=report_data.get("statistics", {}).get("totalCommits", 0),
            total_files=report_data.get("statistics", {}).get("totalFilesChanged", 0),
            total_additions=report_data.get("statistics", {}).get("totalAdditions", 0),
            total_deletions=report_data.get("statistics", {}).get("totalDeletions", 0),
            contributors=", ".join(contributors) or "None",
            commits_data=commits_data or "No commits",
            avg_risk_score=report_data.get("risk_summary", {}).get("averageRiskScore", 0),
            high_risk_count=report_data.get("risk_summary", {}).get("highRiskCommits", 0)
        )
        
        try:
            response = self.model.generate_content(prompt)
            return self._parse_json_response(response.text)
        except Exception as e:
            return {
                "executive_summary": f"Report generation failed: {str(e)}",
                "highlights": [],
                "concerns": [],
                "trends": [],
                "recommendations": [],
                "focus_areas": []
            }
    
    async def analyze_security(self, code_diffs: str) -> Dict[str, Any]:
        """
        Perform security-focused analysis of code changes.
        
        Args:
            code_diffs: String containing code diffs
        
        Returns:
            Security analysis results
        """
        prompt = SECURITY_ANALYSIS_PROMPT.format(code_diffs=code_diffs)
        
        try:
            response = self.model.generate_content(prompt)
            return self._parse_json_response(response.text)
        except Exception as e:
            return {
                "security_score": 50,
                "vulnerabilities": [],
                "secure_practices": [],
                "recommendations": [],
                "error": str(e)
            }


# Singleton instance
gemini_service = GeminiService()
