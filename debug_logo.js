import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mhwxdqcnlibqxeiyyuxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1od3hkcWNubGlicXhlaXl5dXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MTMyOTYsImV4cCI6MjA4NDk4OTI5Nn0.lRUMvDKer6xGl4h5af9E2rlKzxc1FhmNbH9osihx-14';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking 'app_settings' table...");
    const { data, error } = await supabase.from('app_settings').select('*');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data table 'app_settings':");
        console.table(data);
    }
}

check();
