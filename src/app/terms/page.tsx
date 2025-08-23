
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service - Nimbu AI',
    description: 'Terms of Service for Nimbu AI - Your AI-powered personal assistant',
}

export default function TermsOfServicePage() {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="bg-card border border-border rounded-lg shadow-sm">
                    <div className="p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p><strong>Effective Date:</strong> {currentDate}</p>
                                <p><strong>Last Updated:</strong> {currentDate}</p>
                            </div>
                            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="text-sm text-foreground">
                                    <strong>Open Source Project:</strong> Nimbu AI is open-source software created as a personal hobby project.
                                    The code is publicly available for review, contribution, and self-hosting.
                                    Check out the <a href="https://github.com/heyhexadecimal/nimbu-ai" className="text-primary hover:underline">GitHub repository</a>.
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="prose prose-neutral max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Agreement to Terms</h2>
                            <p>
                                By accessing and using Nimbu AI (the "Service"), a personal hobby project created by an individual developer,
                                you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms,
                                then you may not access the Service.
                            </p>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Description of Service</h2>
                            <p>
                                Nimbu AI is an AI-powered personal assistant platform that helps users manage tasks and automate
                                workflows across various Google services. This is a personal side project created as a hobby, not a commercial business.
                            </p>

                            <div className="mt-4 grid gap-3">
                                <h3 className="text-xl font-semibold text-foreground mb-3">Supported Google Services</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {[
                                        { name: 'Gmail', desc: 'Email management and automation' },
                                        { name: 'Google Calendar', desc: 'Event scheduling and management' },
                                        { name: 'Google Meet', desc: 'Meeting creation and management' },
                                        { name: 'Google Docs', desc: 'Document creation and editing' },
                                        { name: 'Google Sheets', desc: 'Spreadsheet management' },
                                        { name: 'Google Drive', desc: 'File organization and storage' },
                                        { name: 'Google Tasks', desc: 'Task creation and tracking' },
                                        { name: 'Google Keep', desc: 'Note-taking and organization' },
                                        { name: 'Google Forms', desc: 'Form creation and management' }
                                    ].map((service, index) => (
                                        <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-white text-sm">{service.name}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{service.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <h3 className="text-xl font-semibold text-foreground mb-3">Service Features</h3>
                                <ul className="space-y-2">
                                    <li><strong>Natural Language Processing:</strong> Interact with your Google services using conversational AI</li>
                                    <li><strong>Task Automation:</strong> Automate repetitive tasks across your connected accounts</li>
                                    <li><strong>Cross-Platform Integration:</strong> Seamlessly work across multiple Google services</li>
                                    <li><strong>Intelligent Assistance:</strong> AI-powered suggestions and task completion</li>
                                    <li><strong>Secure Access:</strong> OAuth 2.0 protected access to your Google services</li>
                                </ul>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">User Accounts and Registration</h2>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-3">Account Creation</h3>
                                    <p>To use Nimbu AI, you must:</p>
                                    <ul className="space-y-2 mt-2">
                                        <li>Create an account using a valid Google account</li>
                                        <li>Provide accurate and complete information</li>
                                        <li>Maintain the security of your account credentials</li>
                                        <li>Be at least 13 years of age (or the minimum age in your jurisdiction)</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-3">Account Responsibilities</h3>
                                    <p>You are responsible for:</p>
                                    <ul className="space-y-2 mt-2">
                                        <li>All activities that occur under your account</li>
                                        <li>Maintaining the confidentiality of your account information</li>
                                        <li>Notifying me immediately of any unauthorized access</li>
                                        <li>Ensuring your account information remains current and accurate</li>
                                    </ul>
                                </div>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Google Services Integration</h2>

                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-4">
                                <h3 className="text-lg font-semibold text-foreground mb-2">Selective Authorization</h3>
                                <p>
                                    <strong>Important:</strong> I don't request any Google permissions during login. Instead, you have complete control
                                    over which Google services to connect. Each service has its own "Connect" button, and you can choose to connect
                                    only the services you want to use with the AI assistant.
                                </p>
                                <p className="mt-2">By connecting specific Google services to Nimbu AI, you:</p>
                                <ul className="space-y-1 mt-2">
                                    <li>Grant permission to access and modify data in those specific services only</li>
                                    <li>Understand that I will act on your behalf based on your instructions to the AI assistant</li>
                                    <li>Can revoke these permissions at any time through your Google Account settings</li>
                                    <li>Can disconnect individual services without affecting others</li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-foreground mb-3">Data Processing</h3>
                                <p>I process your Google services data solely to:</p>
                                <ul className="space-y-2">
                                    <li>Execute tasks you request through the AI assistant</li>
                                    <li>Provide contextual assistance based on your connected services</li>
                                    <li>Improve the accuracy of AI responses</li>
                                    <li>Maintain conversation history for context</li>
                                </ul>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">AI Assistant Limitations and Disclaimers</h2>

                            <div className="space-y-6">
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">AI Accuracy</h3>
                                    <p className="text-amber-700 dark:text-amber-300">While the AI assistant strives for accuracy, you acknowledge that:</p>
                                    <ul className="space-y-1 mt-2 text-amber-700 dark:text-amber-300">
                                        <li>AI responses may contain errors or inaccuracies</li>
                                        <li>You should review AI-generated actions before confirmation</li>
                                        <li>Complex tasks may require human verification</li>
                                        <li>The AI learns from patterns but may not understand context perfectly</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-3">User Responsibility</h3>
                                    <p>You are responsible for:</p>
                                    <ul className="space-y-2">
                                        <li>Reviewing and approving actions performed by the AI</li>
                                        <li>Verifying the accuracy of AI-generated content</li>
                                        <li>Understanding the implications of tasks you request</li>
                                        <li>Backing up important data before AI modifications</li>
                                    </ul>
                                </div>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Acceptable Use Policy</h2>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">Permitted Use</h3>
                                    <ul className="space-y-2 text-green-700 dark:text-green-300 text-sm">
                                        <li>Automate legitimate personal and business tasks</li>
                                        <li>Manage your Google services more efficiently</li>
                                        <li>Receive AI-powered assistance for productivity</li>
                                        <li>Organize and analyze your data</li>
                                    </ul>
                                </div>

                                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">Prohibited Use</h3>
                                    <ul className="space-y-2 text-red-700 dark:text-red-300 text-sm">
                                        <li>Violate any applicable laws or regulations</li>
                                        <li>Infringe on intellectual property rights</li>
                                        <li>Distribute spam, malware, or malicious content</li>
                                        <li>Harass, abuse, or harm others</li>
                                        <li>Access others' accounts without permission</li>
                                        <li>Use for illegal or unauthorized purposes</li>
                                    </ul>
                                </div>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Personal Project Nature</h2>
                            <div className="p-4 bg-muted/50 border border-border rounded-lg">
                                <p>
                                    <strong>Important Notice:</strong> Nimbu AI is a personal hobby project created by an individual developer.
                                    This means:
                                </p>
                                <ul className="space-y-2 mt-3">
                                    <li>There is no company or business entity behind this service</li>
                                    <li>Support and maintenance are provided on a best-effort basis</li>
                                    <li>The service may experience downtime or interruptions</li>
                                    <li>Features may be added, modified, or discontinued without notice</li>
                                    <li>Use the service with appropriate expectations for a hobby project</li>
                                </ul>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Open Source Commitment</h2>
                            <div className="p-4 bg-muted/50 border border-border rounded-lg">
                                <p>
                                    As an open-source project, Nimbu AI provides complete transparency about its operations.
                                    The source code is publicly available for review, allowing you to:
                                </p>
                                <ul className="space-y-2 mt-3">
                                    <li>Verify the security practices and data handling</li>
                                    <li>Contribute improvements and new features</li>
                                    <li>Self-host the application for complete control</li>
                                    <li>Fork the project for your own use cases</li>
                                    <li>Report security vulnerabilities through the GitHub repository</li>
                                </ul>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Privacy and Data Protection</h2>
                            <p>
                                The collection and use of your information is governed by the{' '}
                                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>,
                                which is incorporated into these Terms by reference. I implement reasonable
                                security measures to protect your data, but please note this is a personal project
                                without enterprise-level security infrastructure.
                            </p>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Disclaimers and Limitation of Liability</h2>

                            <div className="p-4 bg-muted border border-border rounded-lg space-y-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Service Disclaimer</h3>
                                    <p className="text-sm">
                                        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
                                        As a personal hobby project, I cannot guarantee uninterrupted service, error-free operation,
                                        or immediate bug fixes.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Personal Project Limitation</h3>
                                    <p className="text-sm">
                                        This is a personal hobby project created by an individual. I am not liable for any
                                        damages, losses, or issues that may arise from using this service. Use at your own risk
                                        and discretion.
                                    </p>
                                </div>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Changes to Terms</h2>
                            <p>
                                I reserve the right to modify these Terms at any time. If I make material changes,
                                I will notify users by posting the updated Terms on the website and, if applicable,
                                through the service itself.
                            </p>
                            <p>
                                Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
                            </p>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Contact Information</h2>
                            <p>For questions about these Terms, please contact me:</p>

                            <div className="mt-4 p-4 bg-card border border-border rounded-lg">
                                <ul className="space-y-2">
                                    <li><strong>Email:</strong> <a href="mailto:heyhexadecimal@gmail.com" className="text-primary hover:underline">heyhexadecimal@gmail.com</a></li>
                                    <li><strong>GitHub:</strong> <a href="https://github.com/heyhexadecimal/nimbu-ai" className="text-primary hover:underline">https://github.com/heyhexadecimal/nimbu-ai</a></li>
                                    <li><strong>Website:</strong> <a href="https://nimbuai.com" className="text-primary hover:underline">https://nimbuai.com</a></li>
                                </ul>
                            </div>

                            <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                                <p className="font-semibold text-foreground mb-2">Acknowledgment</p>
                                <p className="text-sm">
                                    By using Nimbu AI, you acknowledge that you have read, understood, and agree to be bound by
                                    these Terms of Service and the Privacy Policy.
                                </p>
                            </div>

                            <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg">
                                <p className="text-xs text-muted-foreground text-center">
                                    <strong>Personal Project Notice:</strong> This is a hobby project created by an individual developer.
                                    While I strive to provide a good service, please use with appropriate expectations for a personal project.
                                    The source code is available for review and contribution on GitHub.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}