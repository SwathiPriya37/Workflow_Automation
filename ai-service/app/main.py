"""
============================================
FASTAPI AI MICROSERVICE - MAIN ENTRY POINT
============================================

This microservice receives code diffs from the Node.js backend
and uses Gemini 1.5 Flash to analyze them.

Run with: uvicorn app.main:app --reload --port 8000
"""

import os
from datetime import datetime
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from .services.gemini_service import gemini_service

# Load environment variables
load_dotenv()

# ============================================
# PYDANTIC MODELS (Request/Response Schemas)
# ============================================

class FileChange(BaseModel):
    """Schema for a single file change."""
    filename: str
    status: str = Field(..., description="added, removed, modified, or renamed")
    additions: int = 0
    deletions: int = 0
    patch: Optional[str] = None


class CommitStats(BaseModel):
    """Schema for commit statistics."""
    totalAdditions: int = 0
    totalDeletions: int = 0
    filesChanged: int = 0


class Author(BaseModel):
    """Schema for commit author."""
    name: Optional[str] = "Unknown"
    email: Optional[str] = None
    username: Optional[str] = None


class AnalyzeRequest(BaseModel):
    """Request schema for code analysis."""
    commit_sha: str
    commit_message: str
    author: Optional[Author] = None
    files: List[FileChange] = []
    stats: Optional[CommitStats] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "commit_sha": "abc123def456",
                "commit_message": "feat: Add user authentication",
                "author": {"name": "John Doe", "email": "john@example.com"},
                "files": [
                    {
                        "filename": "src/auth.js",
                        "status": "added",
                        "additions": 50,
                        "deletions": 0,
                        "patch": "+function login(user, pass) {...}"
                    }
                ],
                "stats": {
                    "totalAdditions": 50,
                    "totalDeletions": 0,
                    "filesChanged": 1
                }
            }
        }


class ReportDataCommit(BaseModel):
    """Schema for commit in report generation."""
    sha: str
    message: str
    author: str
    files_changed: int
    additions: int
    deletions: int


class ReportDataAnalysis(BaseModel):
    """Schema for analysis in report generation."""
    summary: str
    risk_level: str
    risk_score: int
    bug_probability: int
    improvements: List[str] = []


class DateRange(BaseModel):
    """Schema for date range."""
    start: str
    end: str


class Statistics(BaseModel):
    """Schema for aggregated statistics."""
    totalCommits: int = 0
    totalFilesChanged: int = 0
    totalAdditions: int = 0
    totalDeletions: int = 0


class RiskSummary(BaseModel):
    """Schema for risk summary."""
    averageRiskScore: int = 0
    highRiskCommits: int = 0


class GenerateReportRequest(BaseModel):
    """Request schema for report generation."""
    project_name: str
    repo: str
    date_range: DateRange
    commits: List[ReportDataCommit] = []
    analyses: List[ReportDataAnalysis] = []
    statistics: Statistics
    risk_summary: RiskSummary


class HealthResponse(BaseModel):
    """Response schema for health check."""
    status: str
    timestamp: str
    service: str
    gemini_configured: bool


# ============================================
# FASTAPI APPLICATION
# ============================================

app = FastAPI(
    title="AI Analysis Microservice",
    description="Python microservice for code analysis using Gemini 1.5 Flash",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# API ENDPOINTS
# ============================================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information."""
    return {
        "service": "AI Analysis Microservice",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze",
            "generate_report": "/generate-report",
            "docs": "/docs"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Verifies the service is running and Gemini is configured.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "ai-analysis-microservice",
        "gemini_configured": bool(gemini_key and gemini_key != "your-gemini-api-key-here")
    }


@app.post("/analyze", tags=["Analysis"])
async def analyze_code(request: AnalyzeRequest) -> Dict[str, Any]:
    """
    Analyze code changes using Gemini 1.5 Flash.
    
    This endpoint receives commit data with code diffs and returns
    a comprehensive analysis including:
    - Summary of changes
    - Risk analysis
    - Bug probability
    - Suggested improvements
    - Productivity insights
    
    Args:
        request: AnalyzeRequest containing commit data and diffs
    
    Returns:
        Analysis results as JSON
    """
    # Validate API key is configured
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key not configured"
        )
    
    try:
        # Convert request to dict for processing
        commit_data = {
            "commit_sha": request.commit_sha,
            "commit_message": request.commit_message,
            "author": request.author.model_dump() if request.author else {},
            "files": [f.model_dump() for f in request.files],
            "stats": request.stats.model_dump() if request.stats else {}
        }
        
        # Perform analysis
        result = await gemini_service.analyze_code(commit_data)
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@app.post("/generate-report", tags=["Reports"])
async def generate_report(request: GenerateReportRequest) -> Dict[str, Any]:
    """
    Generate a daily technical report using Gemini 1.5 Flash.
    
    This endpoint receives aggregated commit and analysis data
    and generates a comprehensive daily report including:
    - Executive summary
    - Highlights and concerns
    - Trends and recommendations
    - Focus areas
    
    Args:
        request: GenerateReportRequest containing aggregated data
    
    Returns:
        Report content as JSON
    """
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key not configured"
        )
    
    try:
        # Convert request to dict
        report_data = {
            "project_name": request.project_name,
            "repo": request.repo,
            "date_range": request.date_range.model_dump(),
            "commits": [c.model_dump() for c in request.commits],
            "analyses": [a.model_dump() for a in request.analyses],
            "statistics": request.statistics.model_dump(),
            "risk_summary": request.risk_summary.model_dump()
        }
        
        # Generate report
        result = await gemini_service.generate_report(report_data)
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {str(e)}"
        )


@app.post("/analyze-security", tags=["Security"])
async def analyze_security(code_diffs: Dict[str, str]) -> Dict[str, Any]:
    """
    Perform security-focused analysis on code changes.
    
    Args:
        code_diffs: Dictionary with 'diffs' key containing code diffs
    
    Returns:
        Security analysis results
    """
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key not configured"
        )
    
    try:
        result = await gemini_service.analyze_security(code_diffs.get("diffs", ""))
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Security analysis failed: {str(e)}"
        )


# ============================================
# STARTUP/SHUTDOWN EVENTS
# ============================================

@app.on_event("startup")
async def startup_event():
    """Runs on application startup."""
    print("🚀 AI Analysis Microservice starting...")
    
    # Check Gemini configuration
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your-gemini-api-key-here":
        print("⚠️  WARNING: GEMINI_API_KEY not configured!")
        print("   Set your API key in .env file")
    else:
        print("✅ Gemini API configured")
    
    print(f"📊 Service ready at http://localhost:{os.getenv('PORT', 8000)}")


@app.on_event("shutdown")
async def shutdown_event():
    """Runs on application shutdown."""
    print("👋 AI Analysis Microservice shutting down...")


# ============================================
# RUN WITH UVICORN (for development)
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "true").lower() == "true"
    )
