#!/usr/bin/env python3
"""
Loom Agent - Local file explanation tool
Explains files using code, imports, git history, and OpenAI API
"""

import os
import sys
import subprocess
import re
import json
import urllib.request
import urllib.parse
import urllib.error
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
            content = f.read()
            # Log file size for debugging
            file_size = len(content)
            print(f"Read {file_size} characters from file", file=sys.stderr)
            return content
    except Exception as e:
        print(f"Error reading file: {e}", file=sys.stderr)
        return ""

def extract_imports(content: str, file_path: str) -> List[str]:
    """Extract imports/dependencies from code based on file extension"""
    imports = []
    ext = Path(file_path).suffix.lower()
    
    # Python imports
    if ext in ['.py', '.pyw', '.pyx']:
        pattern = r'^(?:import\s+\w+|from\s+\w+(?:\s+import\s+\w+)?)'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # JavaScript/TypeScript imports
    elif ext in ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']:
        patterns = [
            r'^import\s+.*?from\s+["\']([^"\']+)["\']',
            r'^const\s+\w+\s*=\s*require\(["\']([^"\']+)["\']\)',
            r'^export\s+.*?from\s+["\']([^"\']+)["\']',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            imports.extend(matches)
    
    # HTML - extract script and link tags
    elif ext in ['.html', '.htm']:
        patterns = [
            r'<script\s+[^>]*src=["\']([^"\']+)["\']',
            r'<link\s+[^>]*href=["\']([^"\']+\.(?:css|scss|sass))["\']',
            r'<link\s+[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\']',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            imports.extend(matches)
    
    # CSS/SCSS/SASS - extract @import and @use
    elif ext in ['.css', '.scss', '.sass', '.less']:
        patterns = [
            r'@import\s+["\']([^"\']+)["\']',
            r'@use\s+["\']([^"\']+)["\']',
            r'@forward\s+["\']([^"\']+)["\']',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            imports.extend(matches)
    
    # Java/Kotlin imports
    elif ext in ['.java', '.kt', '.kts']:
        pattern = r'^(?:import|package)\s+([^;]+);'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # C/C++ includes
    elif ext in ['.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.hxx']:
        patterns = [
            r'^#include\s+[<"]([^>"]+)[>"]',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            imports.extend(matches)
    
    # C# using statements
    elif ext == '.cs':
        pattern = r'^using\s+([^;]+);'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # Go imports
    elif ext == '.go':
        patterns = [
            r'import\s+(?:\(|"([^"]+)"|`([^`]+)`)',
            r'^import\s+"([^"]+)"',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            # Flatten tuple results
            for match in matches:
                if isinstance(match, tuple):
                    imports.extend([m for m in match if m])
                else:
                    imports.append(match)
    
    # Rust use statements
    elif ext == '.rs':
        pattern = r'^(?:use|mod)\s+([^;]+);'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # Ruby require/require_relative
    elif ext in ['.rb', '.rake']:
        patterns = [
            r'^(?:require|require_relative)\s+["\']([^"\']+)["\']',
            r'^gem\s+["\']([^"\']+)["\']',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            imports.extend(matches)
    
    # PHP use/require/include
    elif ext in ['.php', '.phtml']:
        patterns = [
            r'^(?:use|require|require_once|include|include_once)\s+[^"\']*["\']([^"\']+)["\']',
            r'^use\s+([^;]+);',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            imports.extend(matches)
    
    # Swift imports
    elif ext == '.swift':
        pattern = r'^import\s+(\w+)'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # Vue single file components
    elif ext == '.vue':
        # Extract script section imports
        script_match = re.search(r'<script[^>]*>(.*?)</script>', content, re.DOTALL | re.IGNORECASE)
        if script_match:
            script_content = script_match.group(1)
            patterns = [
                r'import\s+.*?from\s+["\']([^"\']+)["\']',
                r'require\(["\']([^"\']+)["\']\)',
            ]
            for pattern in patterns:
                matches = re.findall(pattern, script_content, re.MULTILINE)
                imports.extend(matches)
    
    # R library/require
    elif ext == '.r':
        pattern = r'^(?:library|require)\(["\']([^"\']+)["\']\)'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # SQL imports (for some SQL dialects)
    elif ext == '.sql':
        pattern = r'^--\s*@import\s+["\']([^"\']+)["\']'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # Lua require
    elif ext == '.lua':
        pattern = r'require\(["\']([^"\']+)["\']\)'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # Perl use/require
    elif ext in ['.pl', '.pm']:
        pattern = r'^(?:use|require)\s+([^;]+);'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # Dart imports
    elif ext == '.dart':
        pattern = r'^import\s+["\']([^"\']+)["\']'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # Scala imports
    elif ext in ['.scala', '.sc']:
        pattern = r'^import\s+([^;]+)'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # Elixir use/require/import
    elif ext in ['.ex', '.exs']:
        patterns = [
            r'^(?:use|require|import)\s+([^\s\n]+)',
            r'alias\s+([^\s\n]+)',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            imports.extend(matches)
    
    # Haskell imports
    elif ext in ['.hs', '.lhs']:
        pattern = r'^import\s+(?:qualified\s+)?([^\s\n\(]+)'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # MATLAB/Octave (be careful - .m is also Objective-C, but we'll handle it)
    elif ext == '.m':
        # Try to detect MATLAB vs Objective-C by looking for @interface or function keywords
        if '@interface' in content or '@implementation' in content:
            # Objective-C - use #import
            pattern = r'^#import\s+[<"]([^>"]+)[>"]'
            imports = re.findall(pattern, content, re.MULTILINE)
        else:
            # MATLAB - look for function definitions and package imports
            pattern = r'^(?:import|addpath)\s+([^\s\n]+)'
            imports = re.findall(pattern, content, re.MULTILINE)
    
    # Shell scripts - source/include statements
    elif ext in ['.sh', '.bash', '.zsh', '.fish']:
        patterns = [
            r'^(?:source|\.)\s+["\']?([^"\'\s\n]+)["\']?',
            r'^\.\s+["\']?([^"\'\s\n]+)["\']?',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            imports.extend(matches)
    
    # PowerShell - dot sourcing and modules
    elif ext in ['.ps1', '.psm1']:
        patterns = [
            r'^\.\s+["\']([^"\']+)["\']',
            r'Import-Module\s+["\']?([^"\'\s\n]+)["\']?',
            r'^#Requires\s+-Module\s+([^\s\n]+)',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            imports.extend(matches)
    
    # Makefile - include statements
    elif ext in ['.makefile', '.mk', '.make'] or Path(file_path).name.lower() in ['makefile', 'makefile.am', 'makefile.in']:
        pattern = r'^include\s+([^\s\n]+)'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # Dockerfile - FROM, COPY, ADD (these are dependencies in a way)
    elif Path(file_path).name.lower() == 'dockerfile' or ext == '.dockerfile':
        # Extract base images and copied files
        from_pattern = r'^FROM\s+([^\s\n]+)'
        from_matches = re.findall(from_pattern, content, re.MULTILINE | re.IGNORECASE)
        imports.extend(from_matches)
    
    # F# open
    elif ext in ['.fs', '.fsx']:
        pattern = r'^open\s+([^\n]+)'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    # OCaml open
    elif ext in ['.ml', '.mli']:
        pattern = r'^open\s+([^\n]+)'
        imports = re.findall(pattern, content, re.MULTILINE)
    
    return imports[:30]  # Limit to first 30 imports

def get_git_history(file_path: str, repo_root: str) -> str:
    """Get git commit history for a file with more context"""
    try:
        # Get relative path from repo root
        abs_file_path = Path(file_path).absolute()
        abs_repo_root = Path(repo_root).absolute()
        rel_path = abs_file_path.relative_to(abs_repo_root)
        
        # Get last 15 commits for this file with more detail
        result = subprocess.run(
            ['git', 'log', '--follow', '--pretty=format:%h|%s|%an|%ar', '-15', '--', str(rel_path)],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0 and result.stdout:
            commits = result.stdout.strip().split('\n')
            formatted_commits = []
            for commit in commits:
                if '|' in commit:
                    parts = commit.split('|', 3)
                    if len(parts) >= 4:
                        formatted_commits.append(f"{parts[0]} - {parts[1]} ({parts[2]}, {parts[3]})")
                    else:
                        formatted_commits.append(commit)
                else:
                    formatted_commits.append(commit)
            return '\n'.join(formatted_commits)
        
        return "No git history found"
    except Exception as e:
        return f"Error getting git history: {e}"

def get_git_remote_info(repo_root: str) -> Dict:
    """Get git remote origin URL and repository information"""
    info = {
        "remote_url": None,
        "github_repo": None,
        "github_url": None,
        "contributors": [],
        "total_commits": 0,
        "first_commit_date": None,
        "branches": []
    }
    
    try:
        # Get remote URL
        result = subprocess.run(
            ['git', 'remote', 'get-url', 'origin'],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0 and result.stdout.strip():
            remote_url = result.stdout.strip()
            info["remote_url"] = remote_url
            
            # Parse GitHub URL
            github_match = re.search(r'github\.com[:/]([^/]+)/([^/\.]+)', remote_url)
            if github_match:
                owner, repo = github_match.groups()
                repo = repo.replace('.git', '')
                info["github_repo"] = f"{owner}/{repo}"
                info["github_url"] = f"https://github.com/{owner}/{repo}"
        
        # Get contributor list
        result = subprocess.run(
            ['git', 'shortlog', '-sne', '--all'],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout:
            contributors = []
            for line in result.stdout.strip().split('\n')[:10]:  # Top 10 contributors
                match = re.match(r'\s*(\d+)\s+(.+?)\s+<(.+?)>', line)
                if match:
                    contributors.append({
                        "commits": int(match.group(1)),
                        "name": match.group(2).strip(),
                        "email": match.group(3)
                    })
            info["contributors"] = contributors
        
        # Get total commit count
        result = subprocess.run(
            ['git', 'rev-list', '--count', 'HEAD'],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            info["total_commits"] = int(result.stdout.strip())
        
        # Get first commit date
        result = subprocess.run(
            ['git', 'log', '--reverse', '--format=%ai', '-1'],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0 and result.stdout:
            info["first_commit_date"] = result.stdout.strip().split()[0]
        
        # Get branches
        result = subprocess.run(
            ['git', 'branch', '-a'],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            branches = [b.strip().replace('* ', '') for b in result.stdout.split('\n') if b.strip()]
            info["branches"] = branches[:10]  # Limit to 10 branches
            
    except Exception as e:
        print(f"Error getting git remote info: {e}", file=sys.stderr)
    
    return info

def get_file_evolution(file_path: str, repo_root: str) -> Dict:
    """Get detailed file evolution - how the code was written over time"""
    evolution = {
        "total_file_commits": 0,
        "authors": [],
        "timeline": [],
        "recent_changes": [],
        "lines_added_total": 0,
        "lines_removed_total": 0
    }
    
    try:
        abs_file_path = Path(file_path).absolute()
        abs_repo_root = Path(repo_root).absolute()
        rel_path = abs_file_path.relative_to(abs_repo_root)
        
        # Get commit count for this file
        result = subprocess.run(
            ['git', 'rev-list', '--count', 'HEAD', '--', str(rel_path)],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            evolution["total_file_commits"] = int(result.stdout.strip())
        
        # Get authors who modified this file
        result = subprocess.run(
            ['git', 'shortlog', '-sne', '--', str(rel_path)],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout:
            for line in result.stdout.strip().split('\n'):
                match = re.match(r'\s*(\d+)\s+(.+?)\s+<(.+?)>', line)
                if match:
                    evolution["authors"].append({
                        "commits": int(match.group(1)),
                        "name": match.group(2).strip()
                    })
        
        # Get timeline of changes
        result = subprocess.run(
            ['git', 'log', '--format=%h|%s|%an|%ai', '--follow', '-20', '--', str(rel_path)],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout:
            for line in result.stdout.strip().split('\n'):
                if '|' in line:
                    parts = line.split('|', 3)
                    if len(parts) >= 4:
                        evolution["timeline"].append({
                            "hash": parts[0],
                            "message": parts[1][:60] + ('...' if len(parts[1]) > 60 else ''),
                            "author": parts[2],
                            "date": parts[3].split()[0]
                        })
        
        # Get recent changes with stats
        result = subprocess.run(
            ['git', 'log', '--numstat', '--format=%h|%s', '-5', '--', str(rel_path)],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout:
            current_commit = None
            for line in result.stdout.strip().split('\n'):
                if '|' in line:
                    parts = line.split('|', 1)
                    current_commit = {"hash": parts[0], "message": parts[1]}
                elif line.strip() and current_commit:
                    parts = line.split('\t')
                    if len(parts) >= 2:
                        try:
                            added = int(parts[0]) if parts[0] != '-' else 0
                            removed = int(parts[1]) if parts[1] != '-' else 0
                            current_commit["added"] = added
                            current_commit["removed"] = removed
                            evolution["lines_added_total"] += added
                            evolution["lines_removed_total"] += removed
                            evolution["recent_changes"].append(current_commit)
                            current_commit = None
                        except:
                            pass
                            
    except Exception as e:
        print(f"Error getting file evolution: {e}", file=sys.stderr)
    
    return evolution

def get_github_repo_from_url(github_url: str) -> Optional[str]:
    """Extract owner/repo from GitHub URL (e.g., https://github.com/owner/repo -> owner/repo)"""
    if not github_url or not github_url.strip():
        return None
    
    github_url = github_url.strip()
    # Handle various GitHub URL formats
    patterns = [
        r'github\.com[/:]([^/]+)/([^/?#]+)',  # https://github.com/owner/repo
        r'github\.com/([^/]+)/([^/?#]+)',      # github.com/owner/repo
    ]
    
    for pattern in patterns:
        match = re.search(pattern, github_url)
        if match:
            owner = match.group(1)
            repo = match.group(2).rstrip('.git').rstrip('/')
            return f"{owner}/{repo}"
    
    return None

def fetch_github_repo_info(github_url_or_repo: str) -> Optional[Dict]:
    """Fetch GitHub repository information from URL or owner/repo string"""
    # Extract owner/repo if it's a URL
    repo_identifier = get_github_repo_from_url(github_url_or_repo)
    if not repo_identifier:
        # Assume it's already in owner/repo format
        repo_identifier = github_url_or_repo.strip()
        # Remove .git suffix if present
        repo_identifier = repo_identifier.rstrip('.git')
    
    if not repo_identifier or '/' not in repo_identifier:
        return None
    
    try:
        repo_api_url = f"https://api.github.com/repos/{repo_identifier}"
        req = urllib.request.Request(
            repo_api_url,
            headers={
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Loom-Agent/1.0'
            }
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            repo_data = json.loads(response.read().decode())
            
            # Also try to get commit info
            commits_url = f"https://api.github.com/repos/{repo_identifier}/commits?per_page=1"
            commit_count = 0
            try:
                commits_req = urllib.request.Request(
                    commits_url,
                    headers={
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'Loom-Agent/1.0'
                    }
                )
                with urllib.request.urlopen(commits_req, timeout=10) as commits_response:
                    # Try to get total count from Link header if available
                    link_header = commits_response.headers.get('Link', '')
                    if link_header:
                        # Extract total count from Link header if present
                        match = re.search(r'page=(\d+)>; rel="last"', link_header)
                        if match:
                            commit_count = int(match.group(1)) * 30  # Approximate
                    else:
                        # Fallback: try to get total from first response
                        commits_data = json.loads(commits_response.read().decode())
                        if commits_data:
                            commit_count = len(commits_data)
            except Exception as e:
                print(f"Could not fetch commit count: {e}", file=sys.stderr)
            
            return {
                "repo": repo_identifier,
                "url": repo_data.get('html_url', f"https://github.com/{repo_identifier}"),
                "description": repo_data.get('description', '') or '',
                "stars": repo_data.get('stargazers_count', 0),
                "language": repo_data.get('language', ''),
                "created_at": repo_data.get('created_at', ''),
                "updated_at": repo_data.get('updated_at', ''),
                "commit_count": commit_count,
                "default_branch": repo_data.get('default_branch', 'main')
            }
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"Repository not found: {repo_identifier}", file=sys.stderr)
        else:
            print(f"HTTP error fetching repo info: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error fetching GitHub repo info: {e}", file=sys.stderr)
        return None

def search_similar_code_github(code_snippet: str, language: str, repo_root: Optional[str] = None, remote_info: Optional[Dict] = None, project_path: Optional[str] = None, github_url: Optional[str] = None) -> List[Dict]:
    """Search GitHub for similar repositories based on code patterns and dependencies"""
    similar_repos = []
    
    try:
        # First, try to use the provided GitHub URL
        detected_repo = None
        repo_info = None
        
        if github_url and github_url.strip():
            print(f"Using provided GitHub URL: {github_url}", file=sys.stderr)
            repo_info = fetch_github_repo_info(github_url)
            if repo_info:
                detected_repo = repo_info['repo']
                similar_repos.append({
                    "repo": repo_info['repo'],
                    "url": repo_info['url'],
                    "description": (repo_info.get('description', '') or '')[:200],
                    "stars": repo_info.get('stars', 0),
                    "language": repo_info.get('language', ''),
                    "commit_count": repo_info.get('commit_count', 0),
                    "created_at": repo_info.get('created_at', ''),
                    "updated_at": repo_info.get('updated_at', '')
                })
                print(f"Successfully fetched info for provided GitHub repo: {detected_repo}", file=sys.stderr)
        
        # Fallback to detected repository from git remote if no URL provided
        if not detected_repo and remote_info and remote_info.get('github_repo'):
            detected_repo = remote_info['github_repo']
            print(f"Detected GitHub repository: {detected_repo}", file=sys.stderr)
            repo_info = fetch_github_repo_info(detected_repo)
            if repo_info:
                similar_repos.append({
                    "repo": repo_info['repo'],
                    "url": repo_info['url'],
                    "description": (repo_info.get('description', '') or '')[:200],
                    "stars": repo_info.get('stars', 0),
                    "language": repo_info.get('language', ''),
                    "commit_count": repo_info.get('commit_count', 0),
                    "created_at": repo_info.get('created_at', ''),
                    "updated_at": repo_info.get('updated_at', '')
                })
                print(f"Successfully fetched info for detected repo: {detected_repo}", file=sys.stderr)
        
        # Extract key technologies and patterns from the code
        keywords = []
        
        # Extract repository name as keyword if available
        if detected_repo:
            # Extract meaningful parts from repo name (e.g., "scouting-app" -> "scouting", "app")
            repo_parts = re.split(r'[-_\.]', detected_repo.split('/')[-1])
            keywords.extend([p for p in repo_parts if len(p) > 2])
        
        # Extract project name from directory if available
        if project_path:
            project_name = Path(project_path).name
            project_parts = re.split(r'[-_\.]', project_name)
            keywords.extend([p for p in project_parts if len(p) > 2])
        
        # Try to read README for additional keywords
        if repo_root:
            readme_paths = [
                Path(repo_root) / 'README.md',
                Path(repo_root) / 'README.txt',
                Path(repo_root) / 'README',
            ]
            for readme_path in readme_paths:
                if readme_path.exists():
                    try:
                        readme_content = read_file_content(str(readme_path))[:2000].lower()
                        # Extract words that look like project descriptors
                        readme_words = re.findall(r'\b[a-z]{4,15}\b', readme_content)
                        # Filter common words and keep interesting ones
                        common_words = {'this', 'that', 'with', 'from', 'have', 'will', 'would', 'could', 'should', 'project', 'repository', 'github'}
                        interesting_words = [w for w in readme_words if w not in common_words and len(w) > 3]
                        keywords.extend(interesting_words[:5])
                        break
                    except Exception:
                        pass
        
        # Extract framework/library imports
        import_patterns = [
            (r'from\s+(\w+)', 1),  # Python imports
            (r'import\s+["\']([^"\']+)["\']', 1),  # JS/TS imports
            (r'require\(["\']([^"\']+)["\']\)', 1),  # Node requires
            (r'<script.*?src=["\'].*?/([^/"\']+)\.', 1),  # Script tags
        ]
        
        for pattern, group in import_patterns:
            matches = re.findall(pattern, code_snippet)
            keywords.extend(matches[:3])
        
        # Look for common frameworks/libraries mentioned
        framework_keywords = [
            'react', 'vue', 'angular', 'express', 'fastapi', 'django', 'flask',
            'nextjs', 'electron', 'tensorflow', 'pytorch', 'pandas', 'numpy',
            'android', 'kotlin', 'java', 'gradle', 'maven'
        ]
        
        code_lower = code_snippet.lower()
        for fw in framework_keywords:
            if fw in code_lower:
                keywords.append(fw)
        
        # Extract meaningful words from code comments and strings
        comment_patterns = [
            r'//\s*([a-zA-Z]{4,15})',  # Single line comments
            r'/\*\s*([a-zA-Z]{4,15})',  # Multi-line comments start
            r'#\s*([a-zA-Z]{4,15})',  # Python/shell comments
        ]
        for pattern in comment_patterns:
            matches = re.findall(pattern, code_snippet)
            keywords.extend(matches[:3])
        
        # Add language to search
        if language:
            keywords.append(language)
        
        # Clean and deduplicate keywords
        keywords = list(set([k.lower().strip() for k in keywords if len(k) > 2 and len(k) < 20]))
        # Prioritize non-framework keywords
        framework_set = set(fw.lower() for fw in framework_keywords)
        prioritized = [k for k in keywords if k not in framework_set][:4]
        prioritized.extend([k for k in keywords if k in framework_set][:2])
        keywords = prioritized[:6]
        
        if not keywords:
            print("No searchable keywords found in code", file=sys.stderr)
            return similar_repos
        
        # Build search query for repository search (works without auth)
        search_terms = ' '.join(keywords)
        encoded_query = urllib.parse.quote(search_terms)
        
        # Use repository search API (doesn't require authentication)
        search_url = f"https://api.github.com/search/repositories?q={encoded_query}&sort=stars&per_page=5"
        
        print(f"Searching GitHub for related projects: {search_terms}", file=sys.stderr)
        
        req = urllib.request.Request(
            search_url,
            headers={
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Loom-Agent/1.0'
            }
        )
        
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                
                for item in data.get('items', [])[:5]:
                    repo_name = item.get('full_name', '')
                    # Skip if we already have this repo from detected repo
                    if repo_name and repo_name != detected_repo:
                        similar_repos.append({
                            "repo": repo_name,
                            "url": item.get('html_url', f"https://github.com/{repo_name}"),
                            "description": (item.get('description', '') or '')[:100],
                            "stars": item.get('stargazers_count', 0),
                            "language": item.get('language', '')
                        })
                        
                if similar_repos:
                    print(f"Found {len(similar_repos)} related repositories", file=sys.stderr)
                    
        except urllib.error.HTTPError as e:
            if e.code == 403:
                print("GitHub API rate limit reached - try again later", file=sys.stderr)
            elif e.code == 422:
                print("Invalid search query", file=sys.stderr)
            else:
                print(f"GitHub API error: {e.code} {e.reason}", file=sys.stderr)
        except urllib.error.URLError as e:
            print(f"Network error searching GitHub: {e.reason}", file=sys.stderr)
        except Exception as e:
            print(f"Error searching GitHub: {e}", file=sys.stderr)
            
    except Exception as e:
        print(f"Error in code search: {e}", file=sys.stderr)
    
    return similar_repos

def get_language_from_extension(file_path: str) -> str:
    """Get programming language from file extension"""
    ext_map = {
        # Tier 1 - Core Languages
        '.py': 'python', '.pyw': 'python', '.pyx': 'python',
        '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
        '.ts': 'typescript', '.tsx': 'typescript',
        '.java': 'java',
        '.cpp': 'cpp', '.cxx': 'cpp', '.cc': 'cpp', '.c++': 'cpp',
        '.c': 'c', '.h': 'c',
        '.hpp': 'cpp', '.hxx': 'cpp', '.hh': 'cpp',
        
        # Tier 2 - Very Strong Additions
        '.go': 'go',
        '.rs': 'rust',
        '.cs': 'csharp',
        '.php': 'php', '.phtml': 'php',
        '.rb': 'ruby', '.rbw': 'ruby',
        '.swift': 'swift',
        '.kt': 'kotlin', '.kts': 'kotlin',
        
        # Tier 3 - Frontend & Config
        '.html': 'html', '.htm': 'html', '.xhtml': 'html',
        '.css': 'css', '.scss': 'scss', '.sass': 'sass', '.less': 'less',
        '.json': 'json',
        '.yaml': 'yaml', '.yml': 'yaml',
        '.toml': 'toml',
        '.xml': 'xml',
        '.ini': 'ini', '.cfg': 'ini', '.conf': 'ini',
        
        # Tier 4 - Scripting & Shell
        '.sh': 'bash', '.bash': 'bash', '.zsh': 'zsh', '.fish': 'fish',
        '.ps1': 'powershell', '.psm1': 'powershell',
        '.makefile': 'makefile', '.mk': 'makefile', '.make': 'makefile',
        
        # Tier 5 - Advanced/Optional
        '.scala': 'scala', '.sc': 'scala',
        '.hs': 'haskell', '.lhs': 'haskell',
        '.ex': 'elixir', '.exs': 'elixir',
        '.lua': 'lua',
        '.r': 'r',
        '.m': 'matlab',  # Note: Also used for Objective-C
        '.pl': 'perl', '.pm': 'perl',
        
        # Additional
        '.vue': 'vue', '.svelte': 'svelte',
        '.md': 'markdown', '.markdown': 'markdown',
        '.dart': 'dart',
        '.sql': 'sql',
        '.graphql': 'graphql', '.gql': 'graphql',
    }
    ext = Path(file_path).suffix.lower()
    return ext_map.get(ext, '')

def detect_danger_zones(code: str, file_path: str, evolution: Dict = None) -> Dict:
    """Detect potential danger zones in the code"""
    dangers = {
        "risk_level": "low",
        "warnings": [],
        "change_frequency": "unknown",
        "test_coverage": "unknown",
        "complexity_indicators": []
    }
    
    # Check for complexity indicators
    lines = code.split('\n')
    
    # Long file
    if len(lines) > 500:
        dangers["complexity_indicators"].append(f"Large file ({len(lines)} lines)")
        dangers["risk_level"] = "medium"
    
    # Many functions/classes
    func_count = len(re.findall(r'\b(?:def|function|class)\s+\w+', code))
    if func_count > 20:
        dangers["complexity_indicators"].append(f"High function/class count ({func_count})")
        dangers["risk_level"] = "medium"
    
    # Nested callbacks / promise chains
    if code.count('.then(') > 5 or code.count('callback') > 5:
        dangers["complexity_indicators"].append("Complex async patterns detected")
    
    # TODO/FIXME/HACK comments
    todo_count = len(re.findall(r'(?:TODO|FIXME|HACK|XXX|BUG):', code, re.IGNORECASE))
    if todo_count > 0:
        dangers["warnings"].append(f"{todo_count} TODO/FIXME comments found")
    
    # Error handling patterns
    try_count = len(re.findall(r'\b(?:try|catch|except|rescue)\b', code))
    if try_count > 10:
        dangers["complexity_indicators"].append("Heavy error handling")
    
    # Check evolution for change frequency
    if evolution:
        commits = evolution.get('total_file_commits', 0)
        if commits > 50:
            dangers["change_frequency"] = "high"
            dangers["warnings"].append(f"Frequently modified file ({commits} commits)")
            dangers["risk_level"] = "high"
        elif commits > 20:
            dangers["change_frequency"] = "medium"
        else:
            dangers["change_frequency"] = "low"
    
    # Check for test file existence indicators
    file_name = Path(file_path).stem
    if 'test' in file_name.lower() or 'spec' in file_name.lower():
        dangers["test_coverage"] = "this is a test file"
    elif '_test' in code or 'describe(' in code or 'it(' in code or 'def test_' in code:
        dangers["test_coverage"] = "contains tests"
    else:
        # Look for test imports
        if 'jest' in code or 'pytest' in code or 'unittest' in code or 'mocha' in code:
            dangers["test_coverage"] = "has test framework imports"
        else:
            dangers["test_coverage"] = "no tests detected in file"
            dangers["warnings"].append("No test coverage detected for this file")
    
    # Determine final risk level
    if len(dangers["warnings"]) >= 3 or dangers["change_frequency"] == "high":
        dangers["risk_level"] = "high"
    elif len(dangers["warnings"]) >= 1 or len(dangers["complexity_indicators"]) >= 2:
        dangers["risk_level"] = "medium"
    
    return dangers

def call_openai_api(code: str, imports: List[str], history: str, file_path: str, 
                    remote_info: Dict = None, evolution: Dict = None, similar_repos: List = None,
                    mode: str = "senior", danger_zones: Dict = None) -> str:
    """
    Loom AI Analysis
    
    Purpose: Help developers UNDERSTAND code, not generate it.
    This is a codebase interpreter, not a code generator.
    """
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        return "Error: OPENAI_API_KEY environment variable not set. Please set it before running."
    
    # Get model and mode from environment
    model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
    mode = os.getenv('TRACEMIND_MODE', mode)  # beginner or senior
    print(f"Using AI model: {model}, Mode: {mode}", file=sys.stderr)
    
    try:
        client = OpenAI(api_key=api_key)
        
        # Build context sections
        imports_text = '\n'.join(imports[:30]) if imports else "No imports found"
        
        code_content = code[:8000]
        if len(code) > 8000:
            code_content += "\n\n[... truncated ...]"
        
        # Repository context
        repo_context = ""
        if remote_info and remote_info.get('github_repo'):
            repo_context = f"""
Repository: {remote_info['github_repo']}
URL: {remote_info.get('github_url', 'N/A')}
Total Commits: {remote_info.get('total_commits', 'Unknown')}
Project Start: {remote_info.get('first_commit_date', 'Unknown')}
Contributors: {', '.join([c['name'] for c in remote_info.get('contributors', [])[:5]])}
"""
        
        # Evolution context
        evolution_context = ""
        if evolution:
            authors = ', '.join([a['name'] for a in evolution.get('authors', [])[:3]])
            evolution_context = f"""
File Commits: {evolution.get('total_file_commits', 0)}
File Authors: {authors}
Lines Added: +{evolution.get('lines_added_total', 0)}
Lines Removed: -{evolution.get('lines_removed_total', 0)}
"""
            if evolution.get('timeline'):
                evolution_context += "Recent Changes:\n"
                for t in evolution['timeline'][:5]:
                    evolution_context += f"  [{t['date']}] {t['author']}: {t['message']}\n"
        
        # Danger zones context
        danger_context = ""
        if danger_zones:
            danger_context = f"""
Risk Level: {danger_zones.get('risk_level', 'unknown').upper()}
Change Frequency: {danger_zones.get('change_frequency', 'unknown')}
Test Coverage: {danger_zones.get('test_coverage', 'unknown')}
"""
            if danger_zones.get('warnings'):
                danger_context += "Warnings:\n"
                for w in danger_zones['warnings']:
                    danger_context += f"  - {w}\n"
            if danger_zones.get('complexity_indicators'):
                danger_context += "Complexity:\n"
                for c in danger_zones['complexity_indicators']:
                    danger_context += f"  - {c}\n"
        
        # Similar repos context
        similar_context = ""
        if similar_repos:
            similar_context = "Related GitHub repositories (based on code patterns):\n"
            for repo in similar_repos[:5]:
                similar_context += f"  - {repo['repo']}"
                if repo.get('stars'):
                    similar_context += f" ({repo['stars']} stars)"
                similar_context += "\n"
                if repo.get('description'):
                    similar_context += f"    {repo['description']}\n"
                similar_context += f"    {repo['url']}\n"
        
        # Mode-specific instructions
        if mode == "beginner":
            mode_instructions = """
OUTPUT STYLE: Beginner-friendly
- Use simple, clear language
- Define technical terms inline when first used
- Explain concepts step by step
- Use analogies where helpful
- Be thorough in explanations
"""
        else:  # senior mode
            mode_instructions = """
OUTPUT STYLE: Senior developer
- Be concise and direct
- Assume technical knowledge
- Focus on architecture, risks, and non-obvious details
- Skip basic explanations
- Highlight what matters for maintenance and changes
"""

        # The Loom system prompt - following the spec
        system_prompt = """You are Loom, a codebase interpreter.

YOUR PURPOSE:
You help developers UNDERSTAND existing code. You do NOT write new code, autocomplete, or replace Copilot.
You explain structure, intent, history, and risk.

CORE PRINCIPLES:
1. Honesty over confidence - say "uncertain" rather than hallucinate
2. Never invent intent - only infer from evidence (code, commits, patterns)
3. Never shame code - explain why it might be this way
4. Developer empathy - assume past decisions had reasons
5. Evidence-based - cite specific code, commits, patterns

OUTPUT RULES:
- Structured with clear headings
- Calm, professional tone
- No emojis in output
- No hype language
- Bullet points for lists
- Code references in backticks"""

        # Build the analysis prompt
        prompt = f"""Analyze this file and help a developer understand it.

FILE: {Path(file_path).name}
PATH: {file_path}
{mode_instructions}

=== CODE ===
{code_content}

=== DEPENDENCIES ===
{imports_text}

=== GIT HISTORY ===
{history[:1500]}

=== REPOSITORY INFO ===
{repo_context}

=== FILE EVOLUTION ===
{evolution_context}

=== RISK ANALYSIS ===
{danger_context}

=== RELATED PROJECTS ===
{similar_context}

=== REQUIRED ANALYSIS ===

Provide your analysis with these sections:

# [File Name] - Purpose

One paragraph explaining WHY this file exists and what problem it solves.

## File Role in Codebase

- What is this file's responsibility?
- Who imports/uses this file?
- What would break if this file was removed?

## Architecture and Design Decisions

- What patterns are used and why?
- Any notable design choices?
- Historical constraints that may explain the approach?

## Key Components

For each important function/class:
- Name and purpose
- Inputs and outputs
- Side effects or risks

## Dependency Impact

- What this file depends on
- What depends on this file
- Risk level if changed: Low / Medium / High

## Git History Insights

Based on commit history:
- Why was this code introduced?
- Any hotfixes or rushed changes visible?
- Evolution pattern (stable, frequently changed, recently rewritten)

## Danger Zones

- Areas that need careful attention
- Missing test coverage
- Complex or fragile sections
- Technical debt indicators

## Change Recommendations

If someone needs to modify this file:
- What should they understand first?
- What are the safest approaches?
- What should they NOT touch without careful review?

---

Remember:
- Be specific, cite actual code elements
- If uncertain about something, say so
- Explain the "why", not just the "what"
- No emojis, keep it professional"""

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,  # Increased from 1000 to 2000 for deeper analysis
            temperature=0.5  # Lower temperature for more focused, consistent analysis
        )
        
        explanation = response.choices[0].message.content
        
        # Extract token usage information
        token_usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
        
        # Append token usage as JSON comment at the end (will be parsed by electron.js)
        explanation_with_usage = explanation + "\n\n<!--TOKEN_USAGE_START-->\n" + \
                                  json.dumps(token_usage) + "\n<!--TOKEN_USAGE_END-->\n"
        
        return explanation_with_usage
        
    except Exception as e:
        import traceback
        return f"Error calling OpenAI API: {e}\n{traceback.format_exc()}"

def scan_project_directory(project_path: str, max_files: int = 50) -> Dict:
    """Scan a project directory and return file structure and relationships"""
    project_path = Path(project_path).absolute()
    # All supported code file extensions (Tier 1-5)
    code_extensions = {
        # Tier 1 - Core Languages
        '.py', '.pyw', '.pyx',                           # Python
        '.js', '.jsx', '.mjs', '.cjs',                   # JavaScript
        '.ts', '.tsx',                                   # TypeScript
        '.java',                                         # Java
        '.cpp', '.cxx', '.cc', '.c++', '.c', '.h', '.hpp', '.hxx', '.hh',  # C/C++
        
        # Tier 2 - Very Strong Additions
        '.go',                                           # Go
        '.rs',                                           # Rust
        '.cs',                                           # C#
        '.php', '.phtml',                                # PHP
        '.rb', '.rbw',                                   # Ruby
        '.swift',                                        # Swift
        '.kt', '.kts',                                   # Kotlin
        
        # Tier 3 - Frontend & Config
        '.html', '.htm', '.xhtml',                       # HTML
        '.css', '.scss', '.sass', '.less',               # CSS variants
        '.json',                                         # JSON
        '.yaml', '.yml',                                 # YAML
        '.toml',                                         # TOML
        '.xml',                                          # XML
        '.ini', '.cfg', '.conf',                         # INI/Config
        
        # Tier 4 - Scripting & Shell
        '.sh', '.bash', '.zsh', '.fish',                 # Shell scripts
        '.ps1', '.psm1',                                 # PowerShell
        '.makefile', '.mk', '.make',                     # Makefile
        
        # Tier 5 - Advanced/Optional
        '.scala', '.sc',                                 # Scala
        '.hs', '.lhs',                                   # Haskell
        '.ex', '.exs',                                   # Elixir
        '.lua',                                          # Lua
        '.r',                                            # R
        '.m', '.mm',                                     # MATLAB / Objective-C
        '.pl', '.pm',                                    # Perl
        
        # Additional
        '.vue', '.svelte',                               # Frontend frameworks
        '.md', '.markdown',                              # Markdown
        '.txt',                                          # Plain text
        '.clj', '.cljs', '.cljc',                        # Clojure
        '.dart',                                         # Dart
        '.sql',                                          # SQL
        '.graphql', '.gql',                              # GraphQL
    }
    
    files_data = []
    file_imports = {}  # file_path -> list of imported modules/files
    
    print(f"Scanning project directory: {project_path}", file=sys.stderr)
    
    for root, dirs, filenames in os.walk(project_path):
        # Skip hidden directories and common ignore patterns
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', 'venv', '__pycache__', 'build', 'dist', 'target']]
        
        for filename in filenames:
            if len(files_data) >= max_files:
                break
                
            file_path = Path(root) / filename
            ext = file_path.suffix.lower()
            filename_lower = filename.lower()
            
            # Check extension or special filenames (like Dockerfile, Makefile)
            is_code_file = (
                ext in code_extensions or
                filename_lower == 'dockerfile' or
                filename_lower == 'makefile' or
                filename_lower in ['makefile.am', 'makefile.in']
            )
            
            if is_code_file:
                rel_path = file_path.relative_to(project_path)
                try:
                    content = read_file_content(str(file_path))
                    if content:
                        imports = extract_imports(content, str(file_path))
                        files_data.append({
                            'path': str(rel_path),
                            'abs_path': str(file_path),
                            'extension': ext,
                            'size': len(content),
                            'imports': imports
                        })
                        file_imports[str(rel_path)] = imports
                        print(f"  Found: {rel_path} ({len(content)} chars, {len(imports)} imports)", file=sys.stderr)
                except Exception as e:
                    print(f"  Skipping {rel_path}: {e}", file=sys.stderr)
    
    print(f"Scanned {len(files_data)} code files", file=sys.stderr)
    
    # Build dependency graph
    dependencies = {}  # file -> [files that this file imports]
    for file_info in files_data:
        file_path = file_info['path']
        dependencies[file_path] = []
        
        for imp in file_info['imports']:
            # Try to resolve import to a file in the project
            resolved = resolve_import_to_file(imp, file_info['abs_path'], project_path)
            if resolved:
                dependencies[file_path].append(resolved)
    
    return {
        'files': files_data,
        'dependencies': dependencies,
        'project_path': str(project_path)
    }

def resolve_import_to_file(import_path: str, from_file: str, project_root: Path) -> Optional[str]:
    """Try to resolve an import statement to an actual file in the project"""
    from_file_path = Path(from_file)
    project_root = Path(project_root)
    
    # Remove relative path components and normalize
    import_path = import_path.strip().strip('"').strip("'")
    
    # Handle relative imports (starting with .)
    if import_path.startswith('.'):
        # Relative import - resolve from the importing file's directory
        base_dir = from_file_path.parent
        parts = import_path.split('/')
        relative_count = sum(1 for p in parts if p == '.')
        if relative_count > 0:
            for _ in range(relative_count - 1):
                base_dir = base_dir.parent
            import_path = '/'.join([p for p in parts if p != '.'])
    
    # Common patterns for different languages
    # Python: from module.submodule import something -> module/submodule.py
    # JS: from './Component' -> Component.js or Component.jsx
    # Java: import com.example.Class -> com/example/Class.java
    
    # Try common file extensions
    ext = from_file_path.suffix
    test_paths = [
        from_file_path.parent / import_path.replace('.', '/') / f'__init__{ext}',
        from_file_path.parent / f'{import_path}{ext}',
        from_file_path.parent / f'{import_path}.js',
        from_file_path.parent / f'{import_path}.jsx',
        from_file_path.parent / f'{import_path}.ts',
        from_file_path.parent / f'{import_path}.tsx',
        project_root / import_path.replace('.', '/') / f'__init__{ext}',
        project_root / f'{import_path}{ext}',
    ]
    
    for test_path in test_paths:
        try:
            if test_path.exists() and project_root in test_path.parents:
                rel_path = test_path.relative_to(project_root)
                return str(rel_path)
        except:
            pass
    
    return None

def analyze_project_structure(project_data: Dict) -> str:
    """Generate a text description of the project structure"""
    files = project_data['files']
    dependencies = project_data['dependencies']
    
    # Group files by directory
    by_dir = {}
    for file_info in files:
        dir_path = str(Path(file_info['path']).parent)
        if dir_path == '.':
            dir_path = 'root'
        if dir_path not in by_dir:
            by_dir[dir_path] = []
        by_dir[dir_path].append(file_info)
    
    # Count dependencies
    dependency_stats = {}
    for file_path, deps in dependencies.items():
        dependency_stats[file_path] = len(deps)
    
    # Sort files by dependency count (most connected first)
    files_by_deps = sorted(files, key=lambda f: dependency_stats.get(f['path'], 0), reverse=True)
    
    structure_text = f"# Project Structure Analysis\n\n"
    structure_text += f"**Total Files Analyzed:** {len(files)}\n\n"
    
    structure_text += "## Directory Structure\n\n"
    for dir_path in sorted(by_dir.keys()):
        dir_files = by_dir[dir_path]
        structure_text += f"### `{dir_path}/` ({len(dir_files)} files)\n\n"
        for file_info in sorted(dir_files, key=lambda f: f['path']):
            deps_count = dependency_stats.get(file_info['path'], 0)
            structure_text += f"- `{Path(file_info['path']).name}` ({file_info['extension']}, {file_info['size']} chars, {deps_count} dependencies)\n"
        structure_text += "\n"
    
    structure_text += "## Key Files (Most Connected)\n\n"
    for file_info in files_by_deps[:10]:
        file_path = file_info['path']
        deps = dependencies.get(file_path, [])
        structure_text += f"### `{file_path}`\n\n"
        structure_text += f"- **Dependencies:** {len(deps)}\n"
        if deps:
            structure_text += f"- **Depends on:** {', '.join([Path(d).name for d in deps[:5]])}\n"
        structure_text += "\n"
    
    return structure_text

def analyze_project_with_ai(project_data: Dict, api_key: str, model: str, mode: str, repo_root: Optional[str] = None, remote_info: Optional[Dict] = None, github_url: Optional[str] = None) -> str:
    """Call OpenAI API to get project analysis"""
    try:
        client = OpenAI(api_key=api_key)
        
        # Search for similar repositories on GitHub
        similar_repos = []
        try:
            # Combine sample code from multiple files for better search
            sample_code = ""
            for file_info in project_data['files'][:5]:
                file_path = Path(project_data['project_path']) / file_info['path']
                try:
                    content = read_file_content(str(file_path))
                    if content:
                        sample_code += content[:500] + "\n\n"
                except Exception:
                    pass
            
            # Determine primary language from file extensions
            ext_counts = {}
            for file_info in project_data['files']:
                ext = file_info.get('extension', '')
                language = get_language_from_extension(f"dummy{ext}")
                if language:
                    ext_counts[language] = ext_counts.get(language, 0) + 1
            primary_language = max(ext_counts.items(), key=lambda x: x[1])[0] if ext_counts else None
            
            if sample_code and primary_language:
                print("Searching GitHub for similar projects...", file=sys.stderr)
                similar_repos = search_similar_code_github(
                    sample_code[:2000], 
                    primary_language, 
                    repo_root, 
                    remote_info,
                    project_data['project_path'],
                    github_url
                )
                if similar_repos:
                    print(f"Found {len(similar_repos)} similar repositories", file=sys.stderr)
        except Exception as e:
            print(f"Skipping GitHub search: {e}", file=sys.stderr)
        
        # Read actual file contents (limit size per file to avoid token limits)
        files_with_content = []
        max_file_size = 8000  # Max characters per file to include
        total_chars = 0
        max_total_chars = 100000  # Rough token limit (1 token ~= 4 chars, so ~25k tokens for files)
        
        project_path = Path(project_data['project_path'])
        
        # Sort files by importance (most connected files first)
        dependency_stats = {f['path']: len(project_data['dependencies'].get(f['path'], [])) for f in project_data['files']}
        sorted_files = sorted(project_data['files'], key=lambda f: dependency_stats.get(f['path'], 0), reverse=True)
        
        print(f"Including file contents in analysis (up to {max_total_chars} chars total)...", file=sys.stderr)
        for file_info in sorted_files:
            if total_chars >= max_total_chars:
                print(f"Reached size limit, including {len(files_with_content)} files ({total_chars} chars)", file=sys.stderr)
                break
            
            # Use absolute path from file_info if available, otherwise construct it
            file_path = Path(file_info.get('abs_path', project_path / file_info['path']))
            try:
                content = read_file_content(str(file_path))
                if content:
                    original_size = len(content)
                    # Truncate very large files
                    if len(content) > max_file_size:
                        content = content[:max_file_size] + f"\n\n... (file truncated, original size: {original_size} chars)"
                    
                    files_with_content.append({
                        'path': file_info['path'],
                        'extension': file_info['extension'],
                        'content': content,
                        'size': original_size,
                        'imports': file_info['imports']
                    })
                    total_chars += len(content)
                    print(f"  Including: {file_info['path']} ({len(content)}/{original_size} chars)", file=sys.stderr)
            except Exception as e:
                print(f"  Skipping content for {file_info['path']}: {e}", file=sys.stderr)
        
        # Build file contents section
        files_content_text = "\n\n".join([
            f"## File: `{f['path']}`\n\n"
            f"**Extension:** {f['extension']}\n"
            f"**Size:** {f['size']} characters\n"
            f"**Imports:** {', '.join(f['imports'][:10]) if f['imports'] else 'None'}\n\n"
            f"```\n{f['content']}\n```\n\n"
            f"### Description of {f['path'].split('/')[-1]}:\n"
            f"Please provide a comprehensive, detailed explanation (at least 3-4 sentences, ideally 5-8 sentences) of what this file does, its primary purpose, key classes/functions/components, specific functionality, how it relates to other files, and any notable patterns or design decisions."
            for f in files_with_content
        ])
        
        dependencies_summary = "\n".join([
            f"- {file_path} -> {', '.join([Path(d).name for d in deps[:5]])}"
            for file_path, deps in list(project_data['dependencies'].items())[:30]
            if deps
        ])
        
        # Repository context - prioritize provided GitHub URL
        repo_context = ""
        if github_url:
            repo_info_data = fetch_github_repo_info(github_url)
            if repo_info_data:
                repo_context = f"""
## Repository Information

Repository: {repo_info_data['repo']}
URL: {repo_info_data['url']}
Description: {repo_info_data.get('description', 'N/A')}
Stars: {repo_info_data.get('stars', 0)}
Language: {repo_info_data.get('language', 'N/A')}
Created: {repo_info_data.get('created_at', 'Unknown')}
Last Updated: {repo_info_data.get('updated_at', 'Unknown')}
Commits: {repo_info_data.get('commit_count', 'Unknown')}
Default Branch: {repo_info_data.get('default_branch', 'main')}

"""
        elif remote_info and remote_info.get('github_repo'):
            repo_context = f"""
## Repository Information

Repository: {remote_info['github_repo']}
URL: {remote_info.get('github_url', 'N/A')}
Total Commits: {remote_info.get('total_commits', 'Unknown')}
Project Start: {remote_info.get('first_commit_date', 'Unknown')}
Contributors: {', '.join([c['name'] for c in remote_info.get('contributors', [])[:5]])}

"""
        
        # Similar repos context
        similar_context = ""
        if similar_repos:
            similar_context = "## Related GitHub Repositories\n\n"
            for repo in similar_repos[:5]:
                similar_context += f"- **{repo['repo']}**"
                if repo.get('stars'):
                    similar_context += f" ({repo['stars']} stars)"
                similar_context += "\n"
                if repo.get('description'):
                    similar_context += f"  {repo['description']}\n"
                similar_context += f"  {repo['url']}\n\n"
        
        structure_text = analyze_project_structure(project_data)
        
        # Build analysis instructions
        analysis_items = [
            "1. An overview of the project's purpose and architecture",
            "2. Detailed explanation of how the main components/modules work together",
            "3. **For each file in the File Contents section, provide a comprehensive, detailed description** (at least 3-4 sentences, ideally 5-8 sentences) explaining:\n   - What the file does and its primary purpose in the project\n   - Key classes, functions, components, or modules it contains (name and briefly describe each important one)\n   - What specific functionality and features it provides\n   - How it relates to and interacts with other files in the project\n   - Any notable patterns, design decisions, or architectural choices in this file\n   - Dependencies it uses and how they're utilized\n   Format these descriptions clearly after each file's code block. Be thorough and detailed - these descriptions will be used for mind map visualization.",
            "4. How files are connected and depend on each other (with code examples)",
            "5. Any patterns, architectural decisions, or design choices you notice",
            "6. Explain the actual code logic, not just the structure"
        ]
        if repo_context:
            analysis_items.append('7. If repository information is provided above, include it in a "## Code Origins" or "## Repository" section.')
        if similar_context:
            analysis_items.append('8. If related GitHub repositories are listed above, mention them in a "## Related Projects" section with format: "- owner/repo (N stars)"')
        
        analysis_instructions = "\n".join(analysis_items)
        
        user_prompt = f"""Analyze this code project and provide comprehensive insights. I will provide:
1. Project structure overview
2. Dependency relationships
3. Actual file contents (code) from all important files
{'(4. Repository information)' if repo_context else ''}
{'(5. Related GitHub repositories)' if similar_context else ''}

## Project Structure

{structure_text}

## Dependency Relationships

{dependencies_summary}
{repo_context}{similar_context}## File Contents

{files_content_text}

Please provide a comprehensive analysis:
{analysis_instructions}

Format your response with clear sections and use markdown headers. Be thorough and analyze the actual code content. After each file's code block, provide a detailed explanation of what that specific file does."""
        
        system_prompt = """You are a senior software architect analyzing code project structures. 
Provide clear, structured insights about project organization, file relationships, and architecture patterns.
Use markdown formatting with headers and lists."""
        
        if mode == "beginner":
            system_prompt += " Explain concepts in a beginner-friendly way with examples."
        else:
            system_prompt += " Be concise and technical, assume senior developer knowledge."
        
        # Increase max_tokens since we're providing more context
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=4000,  # Increased for more comprehensive analysis
            temperature=0.5
        )
        
        explanation = response.choices[0].message.content
        
        # Extract token usage
        usage = response.usage
        token_info = f"\n<!--TOKEN_USAGE_START-->\n{{\"total_tokens\": {usage.total_tokens}, \"prompt_tokens\": {usage.prompt_tokens}, \"completion_tokens\": {usage.completion_tokens}}}\n<!--TOKEN_USAGE_END-->"
        
        return explanation + token_info
        
    except Exception as e:
        import traceback
        return f"Error calling OpenAI API: {e}\n{traceback.format_exc()}"

def main():
    """Main entry point"""
    import argparse
    parser = argparse.ArgumentParser(description='Loom Agent - Code Analysis Tool')
    parser.add_argument('path', help='File path or project directory (use --project flag for directories)')
    parser.add_argument('--project', action='store_true', help='Analyze as a project directory')
    args = parser.parse_args()
    
    # Debug: print received arguments
    print(f"DEBUG: Received args - path: {args.path}, --project: {args.project}", file=sys.stderr)
    
    # Resolve path to absolute path
    path = os.path.abspath(os.path.expanduser(args.path))
    
    print(f"DEBUG: Resolved path: {path}", file=sys.stderr)
    
    if not os.path.exists(path):
        print(f"Error: Path not found: {path}", file=sys.stderr)
        sys.exit(1)
    
    # Handle project analysis
    # Check if it's a directory or if --project flag is set
    is_directory = os.path.isdir(path)
    print(f"DEBUG: is_directory: {is_directory}, args.project: {args.project}", file=sys.stderr)
    
    # If --project flag is set but path is a file, that's an error
    if args.project and not is_directory:
        print(f"Error: --project flag specified but path is not a directory: {path}", file=sys.stderr)
        sys.exit(1)
    
    if args.project or is_directory:
        print(f"Starting project analysis for: {path} (is_directory: {is_directory}, --project flag: {args.project})", file=sys.stderr)
        project_data = scan_project_directory(path)
        
        if not project_data['files']:
            print("Error: No code files found in project directory", file=sys.stderr)
            sys.exit(1)
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("Error: OPENAI_API_KEY environment variable not set", file=sys.stderr)
            sys.exit(1)
        
        model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
        mode = os.getenv('TRACEMIND_MODE', 'senior')
        
        # Get git repository info for GitHub search
        repo_root = find_repo_root(path)
        remote_info = None
        if repo_root:
            remote_info = get_git_remote_info(repo_root)
            if remote_info.get('github_repo'):
                print(f"Found GitHub repo: {remote_info['github_repo']}", file=sys.stderr)
        
        # Get GitHub URL from environment if provided
        github_url = os.getenv('GITHUB_URL', '').strip()
        if github_url:
            print(f"Using provided GitHub URL: {github_url}", file=sys.stderr)
        
        print("Calling OpenAI API for project analysis...", file=sys.stderr)
        explanation = analyze_project_with_ai(project_data, api_key, model, mode, repo_root, remote_info, github_url)
        
        # Add project structure data as JSON comment for mind map generation
        structure_json = json.dumps({
            'files': [{'path': f['path'], 'imports': f['imports'], 'extension': f.get('extension', '')} for f in project_data['files']],
            'dependencies': project_data['dependencies'],
            'project_path': project_data['project_path']
        })
        explanation += f"\n\n<!--PROJECT_STRUCTURE_START-->\n{structure_json}\n<!--PROJECT_STRUCTURE_END-->"
        
        print(explanation)
        return 0
    
    # Handle single file analysis (existing code)
    # Only proceed if it's actually a file
    if os.path.isdir(path):
        print(f"Error: Path is a directory but --project flag not set: {path}", file=sys.stderr)
        sys.exit(1)
    
    file_path = path
    
    # Read file content
    print(f"Reading file: {file_path}", file=sys.stderr)
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
        if history:
            print(f"Retrieved {len(history)} characters of git history", file=sys.stderr)
    else:
        print("Warning: Not in a git repository, skipping git history", file=sys.stderr)
        history = "File is not in a git repository"
    
    # Get more detailed git history for context
    remote_info = None
    evolution = None
    
    if repo_root:
        try:
            abs_file_path = Path(file_path).absolute()
            abs_repo_root = Path(repo_root).absolute()
            rel_path = abs_file_path.relative_to(abs_repo_root)
            
            # Get file stats and recent changes
            result = subprocess.run(
                ['git', 'log', '--follow', '--stat', '--pretty=format:%h|%s|%an|%ar', '-5', '--', str(rel_path)],
                cwd=repo_root,
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0 and result.stdout:
                detailed_history = result.stdout
                if detailed_history and len(detailed_history) < 2000:
                    history = detailed_history
        except Exception as e:
            print(f"Could not get detailed git history: {e}", file=sys.stderr)
        
        # Get repository remote info (GitHub URL, contributors, etc.)
        print("Fetching repository information...", file=sys.stderr)
        remote_info = get_git_remote_info(repo_root)
        if remote_info.get('github_repo'):
            print(f"Found GitHub repo: {remote_info['github_repo']}", file=sys.stderr)
        
        # Get file evolution data
        print("Analyzing file evolution...", file=sys.stderr)
        evolution = get_file_evolution(file_path, repo_root)
        if evolution.get('total_file_commits'):
            print(f"File has {evolution['total_file_commits']} commits by {len(evolution.get('authors', []))} authors", file=sys.stderr)
    
    # Get GitHub URL from environment if provided
    github_url = os.getenv('GITHUB_URL', '').strip()
    if github_url:
        print(f"Using provided GitHub URL: {github_url}", file=sys.stderr)
    
    # Search for similar code on GitHub (optional - can be slow)
    similar_repos = []
    try:
        language = get_language_from_extension(file_path)
        # Only search if we have meaningful code
        if len(content) > 100 and language:
            print("Searching for similar code patterns on GitHub...", file=sys.stderr)
            similar_repos = search_similar_code_github(content[:2000], language, repo_root, remote_info, None, github_url)
            if similar_repos:
                print(f"Found {len(similar_repos)} similar repositories", file=sys.stderr)
    except Exception as e:
        print(f"Skipping GitHub search: {e}", file=sys.stderr)
    
    # Detect danger zones
    print("Analyzing risk factors...", file=sys.stderr)
    danger_zones = detect_danger_zones(content, file_path, evolution)
    print(f"Risk level: {danger_zones.get('risk_level', 'unknown')}", file=sys.stderr)
    
    # Get analysis mode from environment
    mode = os.getenv('TRACEMIND_MODE', 'senior')
    
    # Call OpenAI API with all the gathered data
    print("Calling Loom AI...", file=sys.stderr)
    explanation = call_openai_api(content, imports, history, file_path, remote_info, evolution, similar_repos, mode, danger_zones)
    
    # Print result (token usage JSON is already appended by call_openai_api)
    print(explanation)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

