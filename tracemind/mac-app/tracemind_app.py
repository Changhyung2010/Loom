#!/usr/bin/env python3
"""
TraceMind Mac App - GUI Application for macOS
A beautiful dark-themed app matching the website design
"""

import os
import sys
import subprocess
import tkinter as tk
from tkinter import ttk, filedialog, scrolledtext, messagebox
from pathlib import Path
import threading
import re

# Color scheme matching website
COLORS = {
    'bg_main': '#1e1e1e',
    'bg_container': '#252526',
    'bg_input': '#3e3e42',
    'text_primary': '#d4d4d4',
    'text_secondary': '#858585',
    'accent': '#4fc3f7',
    'accent_hover': '#81d4fa',
    'border': '#3e3e42',
    'code_bg': '#1e1e1e',
    'code_text': '#ce9178',
}

class TraceMindApp:
    def __init__(self, root):
        self.root = root
        self.root.title("TraceMind")
        self.root.geometry("1000x750")
        self.root.minsize(700, 600)
        
        # Set dark background
        self.root.configure(bg=COLORS['bg_main'])
        
        # Configure dark theme styling
        self.setup_dark_theme()
        
        # Load API key from environment or .env file
        self.load_api_key()
        self.current_file_path = None
        
        # Find agent.py script
        self.agent_path = self.find_agent_script()
        
        self.setup_ui()
        self.check_api_key()
    
    def setup_dark_theme(self):
        """Configure dark theme styles"""
        style = ttk.Style()
        
        # Use a theme that allows customization
        if sys.platform == 'darwin':
            try:
                style.theme_use('aqua')
            except:
                style.theme_use('default')
        else:
            style.theme_use('default')
        
        # Configure styles for dark theme
        style.configure('Dark.TFrame', background=COLORS['bg_container'], borderwidth=0)
        style.configure('Dark.TLabel', background=COLORS['bg_container'], foreground=COLORS['text_primary'])
        style.configure('Dark.TLabelFrame', background=COLORS['bg_container'], foreground=COLORS['accent'], 
                       borderwidth=1, bordercolor=COLORS['border'])
        style.configure('Dark.TLabelFrame.Label', background=COLORS['bg_container'], foreground=COLORS['accent'])
        style.configure('Dark.TButton', background=COLORS['bg_input'], foreground=COLORS['text_primary'])
        style.configure('Primary.TButton', background=COLORS['accent'], foreground=COLORS['bg_main'])
        style.map('Primary.TButton', background=[('active', COLORS['accent_hover'])])
    
    def find_agent_script(self):
        """Find the agent.py script"""
        current_dir = Path(__file__).parent
        agent_path = current_dir.parent / 'agent' / 'agent.py'
        if agent_path.exists():
            return str(agent_path.absolute())
        
        common_paths = [
            Path.home() / 'tracemind' / 'agent' / 'agent.py',
            Path('/usr/local/tracemind/agent/agent.py'),
        ]
        
        for path in common_paths:
            if path.exists():
                return str(path)
        
        return None
    
    def load_api_key(self):
        """Load API key from .env file or environment"""
        self.api_key = os.getenv('OPENAI_API_KEY', '')
        
        agent_dir = Path(__file__).parent.parent / 'agent'
        env_file = agent_dir / '.env'
        if env_file.exists():
            try:
                with open(env_file, 'r') as f:
                    for line in f:
                        if line.startswith('OPENAI_API_KEY='):
                            self.api_key = line.split('=', 1)[1].strip()
                            break
            except Exception:
                pass
        
        if self.api_key:
            os.environ['OPENAI_API_KEY'] = self.api_key
    
    def setup_ui(self):
        """Set up the user interface with dark theme"""
        # Main container with dark background
        main_container = tk.Frame(self.root, bg=COLORS['bg_container'], padx=30, pady=30)
        main_container.pack(fill=tk.BOTH, expand=True)
        
        # Header
        header_frame = tk.Frame(main_container, bg=COLORS['bg_container'])
        header_frame.pack(fill=tk.X, pady=(0, 30))
        
        title_label = tk.Label(
            header_frame, 
            text="TraceMind", 
            font=("SF Pro Display", 32, "bold"),
            bg=COLORS['bg_container'],
            fg=COLORS['accent']
        )
        title_label.pack(side=tk.LEFT)
        
        settings_btn = tk.Button(
            header_frame,
            text="Settings",
            command=self.open_settings,
            bg=COLORS['bg_input'],
            fg=COLORS['text_primary'],
            activebackground=COLORS['border'],
            activeforeground=COLORS['text_primary'],
            relief=tk.FLAT,
            padx=15,
            pady=8,
            font=("SF Pro", 11),
            cursor="hand2"
        )
        settings_btn.pack(side=tk.RIGHT)
        
        # File selection section
        file_section = tk.Frame(main_container, bg=COLORS['bg_container'])
        file_section.pack(fill=tk.X, pady=(0, 20))
        
        file_label_text = tk.Label(
            file_section,
            text="Select a code file to explain:",
            font=("SF Pro", 12),
            bg=COLORS['bg_container'],
            fg=COLORS['text_secondary']
        )
        file_label_text.pack(anchor=tk.W, pady=(0, 10))
        
        file_control_frame = tk.Frame(file_section, bg=COLORS['bg_container'])
        file_control_frame.pack(fill=tk.X)
        
        self.file_label = tk.Label(
            file_control_frame,
            text="No file selected",
            font=("SF Mono", 11),
            bg=COLORS['bg_input'],
            fg=COLORS['text_secondary'],
            anchor=tk.W,
            padx=15,
            pady=12,
            relief=tk.FLAT
        )
        self.file_label.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        browse_btn = tk.Button(
            file_control_frame,
            text="Browse...",
            command=self.browse_file,
            bg=COLORS['accent'],
            fg=COLORS['bg_main'],
            activebackground=COLORS['accent_hover'],
            activeforeground=COLORS['bg_main'],
            relief=tk.FLAT,
            padx=20,
            pady=12,
            font=("SF Pro", 11, "bold"),
            cursor="hand2"
        )
        browse_btn.pack(side=tk.RIGHT)
        
        # Control buttons
        control_frame = tk.Frame(main_container, bg=COLORS['bg_container'])
        control_frame.pack(fill=tk.X, pady=(0, 20))
        
        self.explain_btn = tk.Button(
            control_frame,
            text="Explain File",
            command=self.explain_file,
            state=tk.DISABLED,
            bg=COLORS['accent'],
            fg=COLORS['bg_main'],
            activebackground=COLORS['accent_hover'],
            activeforeground=COLORS['bg_main'],
            relief=tk.FLAT,
            padx=30,
            pady=12,
            font=("SF Pro", 13, "bold"),
            cursor="hand2"
        )
        self.explain_btn.pack(side=tk.LEFT)
        
        self.progress_var = tk.StringVar(value="")
        self.progress_label = tk.Label(
            control_frame,
            textvariable=self.progress_var,
            font=("SF Pro", 11),
            bg=COLORS['bg_container'],
            fg=COLORS['text_secondary']
        )
        self.progress_label.pack(side=tk.LEFT, padx=(20, 0))
        
        # Explanation output section
        output_label = tk.Label(
            main_container,
            text="Explanation:",
            font=("SF Pro", 12),
            bg=COLORS['bg_container'],
            fg=COLORS['accent'],
            anchor=tk.W
        )
        output_label.pack(fill=tk.X, pady=(0, 10))
        
        # Text area with dark theme
        text_frame = tk.Frame(main_container, bg=COLORS['code_bg'], relief=tk.FLAT)
        text_frame.pack(fill=tk.BOTH, expand=True)
        
        self.output_text = scrolledtext.ScrolledText(
            text_frame,
            wrap=tk.WORD,
            font=("SF Mono", 12) if sys.platform == 'darwin' else ("Consolas", 11),
            bg=COLORS['code_bg'],
            fg=COLORS['text_primary'],
            padx=20,
            pady=20,
            relief=tk.FLAT,
            borderwidth=0,
            insertbackground=COLORS['accent'],
            selectbackground=COLORS['bg_input'],
            selectforeground=COLORS['text_primary']
        )
        self.output_text.pack(fill=tk.BOTH, expand=True)
        
        # Welcome message
        welcome_msg = """Welcome to TraceMind!

To get started:
1. Click "Browse..." to select a code file
2. Click "Explain File" to get an AI-powered explanation

The explanation will analyze:
• File content and structure
• Imports and dependencies
• Git commit history
• Project context

Make sure to configure your OpenAI API key in Settings first!"""
        
        self.output_text.insert(tk.END, welcome_msg)
        self.output_text.config(state=tk.DISABLED)
    
    def check_api_key(self):
        """Check if API key is configured"""
        if not self.api_key:
            response = messagebox.askyesno(
                "API Key Required",
                "OpenAI API key is not configured.\n\nWould you like to configure it now?",
                icon="question"
            )
            if response:
                self.open_settings()
    
    def open_settings(self):
        """Open settings dialog with dark theme"""
        settings_window = tk.Toplevel(self.root)
        settings_window.title("TraceMind Settings")
        settings_window.geometry("600x300")
        settings_window.resizable(False, False)
        settings_window.configure(bg=COLORS['bg_container'])
        
        settings_window.transient(self.root)
        settings_window.grab_set()
        
        main_frame = tk.Frame(settings_window, bg=COLORS['bg_container'], padx=30, pady=30)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        title_label = tk.Label(
            main_frame,
            text="Settings",
            font=("SF Pro Display", 24, "bold"),
            bg=COLORS['bg_container'],
            fg=COLORS['accent']
        )
        title_label.pack(anchor=tk.W, pady=(0, 20))
        
        api_label = tk.Label(
            main_frame,
            text="OpenAI API Key:",
            font=("SF Pro", 12),
            bg=COLORS['bg_container'],
            fg=COLORS['text_primary']
        )
        api_label.pack(anchor=tk.W, pady=(0, 10))
        
        api_frame = tk.Frame(main_frame, bg=COLORS['bg_container'])
        api_frame.pack(fill=tk.X, pady=(0, 15))
        
        api_entry = tk.Entry(
            api_frame,
            show="•",
            font=("SF Mono", 11),
            bg=COLORS['bg_input'],
            fg=COLORS['text_primary'],
            insertbackground=COLORS['accent'],
            relief=tk.FLAT,
            borderwidth=0
        )
        api_entry.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10), ipady=8)
        if self.api_key:
            api_entry.insert(0, self.api_key)
        
        def save_api_key():
            new_key = api_entry.get().strip()
            if new_key:
                self.api_key = new_key
                os.environ['OPENAI_API_KEY'] = new_key
                
                agent_dir = Path(__file__).parent.parent / 'agent'
                agent_dir.mkdir(parents=True, exist_ok=True)
                env_file = agent_dir / '.env'
                try:
                    with open(env_file, 'w') as f:
                        f.write(f"OPENAI_API_KEY={new_key}\n")
                    messagebox.showinfo("Success", "API key saved successfully!")
                    settings_window.destroy()
                except Exception as e:
                    messagebox.showerror("Error", f"Could not save API key: {e}")
            else:
                messagebox.showwarning("Warning", "Please enter an API key.")
        
        save_btn = tk.Button(
            api_frame,
            text="Save",
            command=save_api_key,
            bg=COLORS['accent'],
            fg=COLORS['bg_main'],
            activebackground=COLORS['accent_hover'],
            activeforeground=COLORS['bg_main'],
            relief=tk.FLAT,
            padx=20,
            pady=8,
            font=("SF Pro", 11, "bold"),
            cursor="hand2"
        )
        save_btn.pack(side=tk.RIGHT)
        
        info_text = tk.Label(
            main_frame,
            text="Get your API key from: https://platform.openai.com/api-keys\n\nThe API key is stored locally in the .env file.",
            font=("SF Pro", 10),
            bg=COLORS['bg_container'],
            fg=COLORS['text_secondary'],
            justify=tk.LEFT
        )
        info_text.pack(anchor=tk.W, pady=(10, 0))
    
    def browse_file(self):
        """Open file browser - fixed to work properly"""
        file_path = filedialog.askopenfilename(
            title="Select a code file",
            filetypes=[
                ("All code files", "*.py;*.js;*.jsx;*.ts;*.tsx;*.java;*.go"),
                ("Python files", "*.py"),
                ("JavaScript files", "*.js;*.jsx"),
                ("TypeScript files", "*.ts;*.tsx"),
                ("Java files", "*.java"),
                ("Go files", "*.go"),
                ("All files", "*.*")
            ]
        )
        
        if file_path:
            self.load_file(file_path)
    
    def load_file(self, file_path: str):
        """Load a file and enable explain button"""
        if not os.path.exists(file_path):
            messagebox.showerror("Error", f"File not found: {file_path}")
            return
        
        self.current_file_path = file_path
        file_name = os.path.basename(file_path)
        self.file_label.config(text=f"📄 {file_name}", fg=COLORS['text_primary'])
        self.explain_btn.config(state=tk.NORMAL)
    
    def explain_file(self):
        """Explain the current file"""
        if not self.current_file_path:
            messagebox.showwarning("Warning", "Please select a file first.")
            return
        
        if not self.api_key:
            messagebox.showwarning("Warning", "Please configure your OpenAI API key in Settings first.")
            return
        
        if not self.agent_path:
            messagebox.showerror("Error", "Could not find agent.py script. Please ensure TraceMind is properly installed.")
            return
        
        self.explain_btn.config(state=tk.DISABLED)
        self.progress_var.set("Analyzing...")
        
        self.output_text.config(state=tk.NORMAL)
        self.output_text.delete(1.0, tk.END)
        self.output_text.config(state=tk.DISABLED)
        
        thread = threading.Thread(target=self._explain_file_thread, daemon=True)
        thread.start()
    
    def _explain_file_thread(self):
        """Explain file in background thread"""
        try:
            file_path = self.current_file_path
            python_cmd = 'python3' if sys.platform != 'win32' else 'python'
            cmd = [python_cmd, self.agent_path, file_path]
            
            self.root.after(0, lambda: self.progress_var.set("Reading file..."))
            
            env = os.environ.copy()
            env['OPENAI_API_KEY'] = self.api_key
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=env,
                cwd=Path(self.agent_path).parent
            )
            
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr if stderr else "Unknown error occurred"
                raise Exception(error_msg)
            
            explanation = stdout.strip()
            explanation = re.sub(r'^=+\s*$', '', explanation, flags=re.MULTILINE).strip()
            
            if not explanation:
                raise Exception("No explanation received from agent")
            
            self.root.after(0, lambda: self._display_result(explanation, file_path))
            
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            self.root.after(0, lambda: self._display_error(error_msg))
    
    def _display_result(self, explanation: str, file_path: str):
        """Display the explanation result"""
        self.output_text.config(state=tk.NORMAL)
        self.output_text.delete(1.0, tk.END)
        
        file_name = os.path.basename(file_path)
        header = f"Explanation for: {file_name}\n"
        header += "=" * 70 + "\n\n"
        
        self.output_text.insert(tk.END, header)
        self.output_text.insert(tk.END, explanation)
        
        # Style the header
        header_start = "1.0"
        header_end = f"1.{len(header)}"
        self.output_text.tag_add("header", header_start, header_end)
        self.output_text.tag_config("header", 
                                   font=("SF Pro Display", 14, "bold") if sys.platform == 'darwin' else ("TkDefaultFont", 12, "bold"),
                                   foreground=COLORS['accent'])
        
        self.output_text.config(state=tk.DISABLED)
        self.progress_var.set("Complete!")
        self.explain_btn.config(state=tk.NORMAL)
        
        self.root.after(2000, lambda: self.progress_var.set(""))
    
    def _display_error(self, error_msg: str):
        """Display error message"""
        self.output_text.config(state=tk.NORMAL)
        self.output_text.delete(1.0, tk.END)
        self.output_text.insert(tk.END, f"❌ {error_msg}\n\n")
        self.output_text.insert(tk.END, "Please check:\n")
        self.output_text.insert(tk.END, "• That the file path is valid\n")
        self.output_text.insert(tk.END, "• That your OpenAI API key is configured correctly\n")
        self.output_text.insert(tk.END, "• That you have an internet connection")
        self.output_text.config(state=tk.DISABLED)
        self.progress_var.set("Error occurred")
        self.explain_btn.config(state=tk.NORMAL)
        
        messagebox.showerror("Error", error_msg)
        self.root.after(2000, lambda: self.progress_var.set(""))


def main():
    """Main entry point"""
    root = tk.Tk()
    app = TraceMindApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
