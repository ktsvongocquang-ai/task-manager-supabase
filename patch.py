import sys

def restore_lines():
    import subprocess
    
    # Get original file content from HEAD
    result = subprocess.run(["git", "show", "HEAD:src/pages/marketing/MarketingTaskModal.tsx"], capture_output=True, text=True, encoding="utf-8")
    original_lines = result.stdout.splitlines()
    
    # original lines corresponding to what got deleted.
    # The start is around {/* Tabs Section */} which is index ~1247.
    # The end is around {/* Footer fixed */} which is index ~1433.
    
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(original_lines):
        if "    {/* Tabs Section */}" in line:
            start_idx = i
        if "    {/* Footer fixed */}" in line:
            end_idx = i
            
    if start_idx == -1 or end_idx == -1:
        print(f"Error finding indices in HEAD: start={start_idx}, end={end_idx}")
        return
        
    print(f"Extracting original lines from {start_idx} to {end_idx}")
    lines_to_restore = original_lines[start_idx:end_idx]
    
    # Now read the current file
    with open("src/pages/marketing/MarketingTaskModal.tsx", "r", encoding="utf-8") as f:
        current_lines = f.read().splitlines()
        
    # Find where to insert in current file
    insert_idx = -1
    remove_idx = -1
    for i, line in enumerate(current_lines):
        if "    {/* Details Content Table */}" in line:
            # The next lines are:
            # <div className="px-8 mb-6">
            # ...
            # </div>
            pass
        if "const { error } = await supabase.from('marketing_tasks').update({ isarchived: true }).eq('id', editingTask.id);" in line:
            insert_idx = i
            remove_idx = i # wait, is there any garbage to remove?
            break
            
    if insert_idx == -1:
        print("Error finding insert index in current file")
        return
        
    # Apply mobile padding changes to the restored lines too, so we don't have to run replace again!
    for i in range(len(lines_to_restore)):
        if '<div className="mt-8 pl-14 pr-4">' in lines_to_restore[i]:
            lines_to_restore[i] = lines_to_restore[i].replace('pl-14', 'pl-4 sm:pl-14')
            
    # Also fix the Details Content Table padding (which I did in the failed chunk)
    # Actually wait, the last successful chunk had the wrong line numbering that caused this. Let's fix it later.
    
    new_content = current_lines[:insert_idx] + lines_to_restore + current_lines[insert_idx:]
    
    with open("src/pages/marketing/MarketingTaskModal.tsx", "w", encoding="utf-8") as f:
        f.write("\n".join(new_content) + "\n")
        
    print("Patch successful!")

if __name__ == "__main__":
    restore_lines()
