import { useState, useEffect } from "react";
import { useData } from "@/features/data/DataContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy, Send } from "lucide-react";

export default function Support() {
    const { userProfile } = useData();
    const [name, setName] = useState(userProfile.displayName || "");
    const [email, setEmail] = useState(userProfile.email || "");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userProfile.displayName) setName(userProfile.displayName);
        if (userProfile.email) setEmail(userProfile.email);
    }, [userProfile]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            toast.success(`Message sent! We'll be in touch with ${email} shortly.`);
            setMessage("");
            setIsSubmitting(false);
        }, 1000);
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Support</h1>
                <p className="text-muted-foreground">
                    Need help? Send us a message and our team will assist you.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LifeBuoy className="h-5 w-5 text-indigo-500" /> Contact Support
                    </CardTitle>
                    <CardDescription>
                        Fill out the form below to reach our support team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                            />
                            <p className="text-xs text-muted-foreground">
                                We'll send the reply to this email address.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Describe your issue or question..."
                                className="min-h-[150px]"
                                value={message}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                "Sending..."
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" /> Send Message
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
