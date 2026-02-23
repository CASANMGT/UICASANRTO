import os
import re

css_dir = "css"
style_css = "css/style.css"

# Typography Scale Definition
SCALE = {
    7: "--text-3xs",
    8: "--text-2xs",
    9: "--text-xs",
    10: "--text-sm",
    11: "--text-md",
    12: "--text-base",
    13: "--text-lg",
    14: "--text-xl",
    16: "--text-2xl",
    18: "--text-3xl",
    20: "--text-4xl",
    22: "--text-5xl",
    26: "--text-6xl",
    28: "--text-7xl",
    32: "--text-8xl",
    36: "--text-9xl",
    52: "--text-hero"
}

NEW_ROOT_VARS = """
    /* Typography Scale */
    --text-3xs: 7px;
    --text-2xs: 8px;
    --text-xs: 9px;
    --text-sm: 10px;
    --text-md: 11px;
    --text-base: 12px;
    --text-lg: 13px;
    --text-xl: 14px;
    --text-2xl: 16px;
    --text-3xl: 18px;
    --text-4xl: 20px;
    --text-5xl: 22px;
    --text-6xl: 26px;
    --text-7xl: 28px;
    --text-8xl: 32px;
    --text-9xl: 36px;
    --text-hero: 52px;
"""

def update_style_css_root():
    with open(style_css, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '--text-base' not in content:
        # Insert after :root {
        content = re.sub(r'(:root\s*\{)', r'\1' + NEW_ROOT_VARS, content)
        with open(style_css, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Added typography scale to style.css :root")

def closest_scale(px_val):
    return min(SCALE.keys(), key=lambda k: abs(k - px_val))

def replace_font_sizes(content):
    def replacer(match):
        full_match = match.group(0)
        size_str = match.group(1)
        try:
            size_px = float(size_str)
            closest = closest_scale(size_px)
            var_name = SCALE[closest]
            return f"font-size: var({var_name})"
        except ValueError:
            return full_match
            
    # Matches font-size: Xpx or font-size:Xpx
    pattern = r'font-size:\s*([0-9.]+)\s*px'
    new_content = re.sub(pattern, replacer, content)
    return new_content

def process_css_files():
    for root, _, files in os.walk(css_dir):
        for file in files:
            if file.endswith('.css'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = replace_font_sizes(content)
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated font-sizes in {path}")

def process_js_html_files():
    for ext in ['.js', '.html']:
        for root, _, files in os.walk('.'):
            if "python" in root or ".git" in root or "node_modules" in root:
                continue
            for file in files:
                if file.endswith(ext):
                    path = os.path.join(root, file)
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    new_content = replace_font_sizes(content)
                    if new_content != content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated style attributes in {path}")

if __name__ == "__main__":
    update_style_css_root()
    process_css_files()
    process_js_html_files()
    print("Done standardizing font-sizes!")

