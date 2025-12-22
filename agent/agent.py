#!/usr/bin/env python3
"""
TraceMind Agent - Local file explanation tool
Explains files using code, imports, git history, and OpenAI API
"""

import os
import sys
import subprocess
import re
from pathlib import Path
from typing import Optional, Dict, List
from dotenv import load_dotenv

try:
    from openai import OpenAI
except ImportError:
    print("Error: openai package not installed. Run: pip install openai")
    sys.exit(1)

# Load environment variables
load_dotenv()

def find_repo_root(file_path: str) -> Optional[str]:
    """Find the git repository root directory"""
    current_dir = Path(file_path).parent.absolute()
    
    while current_dir != current_dir.parent:
        git_dir = current_dir / '.git'
        if git_dir.exists():
            return str(current_dir)
        current_dir = current_dir.parent
    
    return None

def read_file_content(file_path: str) -> str:
    """Read the content of a file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading file: {e}", file=sys.stderr)
        return ""

def extract_imports(content: str, file_path: str) -> List[str]:
    """Extract imports/dependencies from code based on file extension"""
    imports = []
    ext = Path(file_path).suffix.lower()
    
    # Python imports
    if ext == '.py':
        pattern = r'^(?:import\s+\w+|from\s+\w+(?:\s+import\s+\w+)?)'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # JavaScript/TypeScript imports
    elif ext in ['.js', '.jsx', '.ts', '.tsx']:
        patterns = [
            r'^import\s+.*?from\s+["\']([^"\']+)["\']',
            r'^const\s+\w+\s*=\s*require\(["\']([^"\']+)["\']\)',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            imports.extend(matches)
    
    # Java imports
    elif ext == '.java':
        pattern = r'^import\s+([^;]+);'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # Go imports
    elif ext == '.go':
        pattern = r'^import\s+(?:\(|"([^"]+)"|`([^`]+)`)'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    return imports[:20]  # Limit to first 20 imports

def get_git_history(file_path: str, repo_root: str) -> str:
    """Get git commit history for a file"""
    try:
        # Get relative path from repo root
        abs_file_path = Path(file_path).absolute()
        abs_repo_root = Path(repo_root).absolute()
        rel_path = abs_file_path.relative_to(abs_repo_root)
        
        # Get last 10 commits for this file
        result = subprocess.run(
            ['git', 'log', '--follow', '--pretty=format:%h %s (%an, %ar)', '-10', '--', str(rel_path)],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0 and result.stdout:
            return result.stdout
        
        return "No git history found"
    except Exception as e:
        return f"Error getting git history: {e}"

def call_openai_api(code: str, imports: List[str], history: str, file_path: str) -> str:
    """Call OpenAI API to explain the file"""
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        return "Error: OPENAI_API_KEY environment variable not set. Please set it before running."
    
    try:
        client = OpenAI(api_key=api_key)
        
        # Build the prompt
        imports_text = '\n'.join(imports[:20]) if imports else "No imports found"
        
        prompt = f"""You are a senior software engineer. Explain this file in the context of the project.

File: {Path(file_path).name}

File Content:
{code[:3000]}  # Limit to first 3000 chars

Imports/Dependencies:
{imports_text}

Git History (recent commits):
{history[:1000]}  # Limit to first 1000 chars

Provide a clear, concise explanation of:
1. What this file does
2. Key functions/classes and their purposes
3. How it fits into the project
4. Important dependencies and why they're used

Format as readable markdown text. Keep it under 500 words."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using cheaper model for MVP
            messages=[
                {"role": "system", "content": "You are a helpful code reviewer and documentation expert."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        import traceback
        return f"Error calling OpenAI API: {e}\n{traceback.format_exc()}"

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python agent.py <file_path>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)
    
    # Read file content
    print("Reading file...", file=sys.stderr)
    content = read_file_content(file_path)
    
    if not content:
        print("Error: Could not read file content", file=sys.stderr)
        sys.exit(1)
    
    # Extract imports
    print("Extracting imports...", file=sys.stderr)
    imports = extract_imports(content, file_path)
    
    # Get git history
    repo_root = find_repo_root(file_path)
    history = ""
    if repo_root:
        print(f"Found git repo at: {repo_root}", file=sys.stderr)
        history = get_git_history(file_path, repo_root)
    else:
        print("Warning: Not in a git repository, skipping git history", file=sys.stderr)
        history = "File is not in a git repository"
    
    # Call OpenAI API
    print("Calling OpenAI API...", file=sys.stderr)
    explanation = call_openai_api(content, imports, history, file_path)
    
    # Print result
    print("\n" + "="*70)
    print(explanation)
    print("="*70)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

