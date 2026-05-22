def check_template(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()

    stack = []
    template_started = False
    
    for i, line in enumerate(lines):
        line_num = i + 1
        
        # Simple regex for tags
        # Find all <tag and </tag
        tags = re.findall(r'<(/?)([a-zA-Z0-9-]+)', line)
        
        for is_closing, tag_name in tags:
            if tag_name == 'template' and not is_closing:
                if not template_started:
                    template_started = True
                    continue
            
            if not template_started:
                continue
                
            if tag_name == 'template' and is_closing:
                if template_started and not stack:
                    template_started = False
                    continue

            # Skip self-closing tags (approximate)
            if re.search(f'<{tag_name}[^>]*/>', line):
                continue
                
            if is_closing:
                if not stack:
                    print(f"Error: Unexpected closing tag </{tag_name}> at line {line_num}")
                else:
                    last_tag, last_line = stack.pop()
                    if last_tag != tag_name:
                        print(f"Error: Mismatched tag </{tag_name}> at line {line_num} (expected </{last_tag}> from line {last_line})")
            else:
                stack.append((tag_name, line_num))
                
    if stack:
        print("\nUnclosed tags at end of template:")
        for tag, line in stack:
            print(f"<{tag}> from line {line}")

import re
check_template('/Users/evanvosh/Documents/app1.1/src/shared/ui/components/ExTacticalNodeMap.vue')
