import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://mhwxdqcnlibqxeiyyuxl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1od3hkcWNubGlicXhlaXl5dXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MTMyOTYsImV4cCI6MjA4NDk4OTI5Nn0.lRUMvDKer6xGl4h5af9E2rlKzxc1FhmNbH9osihx-14";
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data, error } = await supabase.from("todos").select("*").limit(1);
    if (error) console.error("Error:", error);
    else if (data.length > 0) console.log("Columns:", Object.keys(data[0]));
    else console.log("Table empty, cannot guess columns.");
}
inspect();
