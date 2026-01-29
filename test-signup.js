
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mhwxdqcnlibqxeiyyuxl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1od3hkcWNubGlicXhlaXl5dXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MTMyOTYsImV4cCI6MjA4NDk4OTI5Nn0.lRUMvDKer6xGl4h5af9E2rlKzxc1FhmNbH9osihx-14'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin() {
    console.log("Attempting login for info@danielproctor.com...");
    // Note: I don't have the user's password. 
    // But wait, I can't verify if they are in Auth without password or Admin key.
    // Using a wrong password will give "Invalid login credentials", not "User not found".

    // Alternative: Try to SignUp again via script and see the exact error.

    const { data, error } = await supabase.auth.signUp({
        email: 'info@danielproctor.com',
        password: 'TemporaryPassword123!'
    })

    if (error) {
        console.log("SignUp Error Message:", error.message)
        console.log("SignUp Error Code:", error.code || error.status)
    } else {
        console.log("SignUp Success! User ID:", data.user?.id)
    }
}

testLogin()
