const fs = require('fs');
const path = 'src/pages/Workouts.tsx';
let c = fs.readFileSync(path, 'utf8');

if (!c.includes('ScheduleBuilderModal')) {
    c = c.replace(
        'import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";',
        'import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { ScheduleBuilderModal } from "@/components/ScheduleBuilderModal";'
    );
    
    // insert next to the dialog trigger
    c = c.replace(
        '<Dialog open={open} onOpenChange={setOpen}>',
        '<ScheduleBuilderModal />\n                    <Dialog open={open} onOpenChange={setOpen}>'
    );
    
    fs.writeFileSync(path, c, 'utf8');
    console.log('patched');
} else {
    console.log('already patched');
}
