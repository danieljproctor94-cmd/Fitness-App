const fs = require('fs');
const path = "c:\\Users\\info\\.gemini\\antigravity\\brain\\Fitness App Web\\src\\pages\\Dashboard.tsx";

try {
    let content = fs.readFileSync(path, 'utf8');

    // 1. Replace CardHeader
    // Find the CardHeader containing "Tasks for Today"
    // Use a regex that captures the CardHeader tag and its content until close tag.
    
    // Pattern: <CardHeader[^>]*>\s*<div[^>]*>\s*<CardTitle>Tasks for Today</CardTitle>[\s\S]*?<\/CardHeader>
    // This matches the current nested div structure.
    
    const headerRegex = /<CardHeader[^>]*>\s*<div[^>]*>\s*<CardTitle>Tasks for Today<\/CardTitle>[\s\S]*?<\/CardHeader>/;
    
    const newHeader = `                    <CardHeader className="flex flex-row items-center justify-between pb-6 shrink-0">
                        <CardTitle>Tasks for Today</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setIsAddOpen(true)}>
                                <Plus className="h-3.5 w-3.5" /> Quick Add
                            </Button>
                        </div>
                    </CardHeader>`;
    
    if (headerRegex.test(content)) {
        content = content.replace(headerRegex, newHeader);
        console.log("CardHeader updated.");
    } else {
        console.log("CardHeader pattern not found. Checking if already updated or structure differs.");
        // Fallback: maybe just search for "Tasks for Today" context?
        // But the previous edit was successful in adding messy indentation, so regex should match if flexible.
    }
    
    // 2. Replace CardContent className
    // Search for the specific string `pr-2 scrollbar-thin`
    // Convert to `px-6 scrollbar-thin`
    
    if (content.includes('pr-2 scrollbar-thin')) {
        content = content.replace('pr-2 scrollbar-thin', 'px-6 scrollbar-thin');
        console.log("CardContent padding updated.");
    } else {
        console.log("CardContent pattern not found.");
    }

    fs.writeFileSync(path, content, 'utf8');

} catch (e) { console.error(e); }