
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mhwxdqcnlibqxeiyyuxl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1od3hkcWNubGlicXhlaXl5dXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MTMyOTYsImV4cCI6MjA4NDk4OTI5Nn0.lRUMvDKer6xGl4h5af9E2rlKzxc1FhmNbH9osihx-14'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRole() {
    console.log("Checking role for info@danielproctor.com...");
    const { data, error } = await supabase
        .from('profiles')
        .select('email, subscription_tier')
        .eq('email', 'info@danielproctor.com');

    if (error) {
        console.error('Error fetching profile:', error);
    } else {
        console.log('Profile Data:', data);
    }
}

checkRole()
