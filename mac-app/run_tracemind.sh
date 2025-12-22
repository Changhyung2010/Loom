#!/bin/bash
# TraceMind Mac App Launcher with Python version check and auto-setup

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to check if tkinter works with a Python version
check_tkinter() {
    local python_cmd=$1
    $python_cmd -c "import tkinter; import tkinter as tk; tk.Tk().destroy()" &>/dev/null
}

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

# Try python3.12 first (best compatibility)
if command -v python3.12 &> /dev/null; then
    if check_tkinter python3.12; then
        echo "✅ Using Python 3.12"
        python3.12 tracemind_app.py
        exit $?
    else
        echo "⚠️  Python 3.12 found but tkinter not available"
        echo "Installing python-tk@3.12..."
        if command -v brew &> /dev/null; then
            brew install python-tk@3.12
            if check_tkinter python3.12; then
                echo "✅ Tkinter installed! Using Python 3.12"
                python3.12 tracemind_app.py
                exit $?
            fi
        fi
    fi
fi

# Try python3.11
if command -v python3.11 &> /dev/null; then
    if check_tkinter python3.11; then
        echo "✅ Using Python 3.11"
        python3.11 tracemind_app.py
        exit $?
    fi
fi

# Try system python3 if it's 3.11+
if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -ge 11 ]; then
    if check_tkinter python3; then
        echo "✅ Using Python $PYTHON_VERSION"
        python3 tracemind_app.py
        exit $?
    fi
fi

# If we get here, we need to install Python 3.12
echo ""
echo "=========================================="
echo "Python/Tkinter Setup Required"
echo "=========================================="
echo ""
echo "Your Python version ($PYTHON_VERSION) has compatibility issues with macOS 26."
echo ""
echo "I can automatically install Python 3.12 with tkinter support."
echo "This requires Homebrew."
echo ""

if command -v brew &> /dev/null; then
    read -p "Install Python 3.12 with tkinter? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing Python 3.12..."
        brew install python@3.12 python-tk@3.12
        if check_tkinter python3.12; then
            echo "✅ Installation complete! Running app..."
            python3.12 tracemind_app.py
            exit $?
        else
            echo "❌ Installation failed. Please install manually."
            exit 1
        fi
    fi
else
    echo "Homebrew not found. Please install manually:"
    echo "  1. Install Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "  2. Install Python: brew install python@3.12 python-tk@3.12"
    echo "  3. Run: python3.12 tracemind_app.py"
    echo ""
    echo "Or use the VS Code extension instead!"
    exit 1
fi

echo ""
echo "Installation cancelled. See TROUBLESHOOTING.md for manual setup."
exit 1

