import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy - Nimbu AI',
    description: 'Privacy Policy for Nimbu AI - Your AI-powered personal assistant',
}

export default function PrivacyPolicyPage() {
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
                            <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p><strong>Effective Date:</strong> {currentDate}</p>
                                <p><strong>Last Updated:</strong> {currentDate}</p>
                            </div>
                            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="text-sm text-foreground">
                                    <strong>Open Source Notice:</strong> Nimbu AI is an open-source personal project.
                                    The code is publicly available and community contributions are welcome.
                                    View the source code on <a href="https://github.com/heyhexadecimal/nimbu-ai" className="text-primary hover:underline">GitHub</a>.
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="prose prose-neutral max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Introduction</h2>
                            <p>
                                Nimbu AI ("I," "my," or "the project") operates the nimbuai.com website and provides AI-powered
                                personal assistant services (the "Service"). This Privacy Policy explains how I collect,
                                use, and protect your information when you use this Service.
                            </p>
                            <p>
                                This is a personal side project created as a hobby. By using Nimbu AI, you agree to the collection and use of information in accordance with this Privacy Policy.
                            </p>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Information I Collect</h2>

                            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Personal Information</h3>
                            <p>I collect information you provide directly, including:</p>
                            <ul className="space-y-2">
                                <li>Name and email address (via Google OAuth)</li>
                                <li>Profile information from your Google account</li>
                                <li>Messages and conversations with the AI assistant</li>
                                <li>Preferences and settings within the Service</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Google Services Data (Optional Connections)</h3>
                            <p>
                                <strong>Important:</strong> I don't ask for any Google permissions during login. Instead, you can selectively
                                connect individual Google services by clicking "Connect" buttons for specific apps you want to use.
                                You have full control over which services to connect.
                            </p>
                            <p>When you choose to connect specific Google services to Nimbu AI, I may access and process data from:</p>

                            <div className="grid gap-4 mt-4">
                                {[
                                    { name: 'Gmail', permissions: ['Read, compose, send, and manage your emails', 'Access email attachments and metadata', 'Organize and label emails on your behalf'] },
                                    { name: 'Google Calendar', permissions: ['Read, create, update, and delete calendar events', 'Manage calendar invitations and responses', 'Access calendar metadata and settings'] },
                                    { name: 'Google Meet', permissions: ['Create and manage video meetings', 'Schedule and cancel meetings', 'Access meeting details and participant information'] },
                                    { name: 'Google Docs', permissions: ['Read, create, edit, and manage documents', 'Access document content and formatting', 'Share and collaborate on documents'] },
                                    { name: 'Google Sheets', permissions: ['Read, create, edit, and manage spreadsheets', 'Access cell data and formulas', 'Perform data analysis and calculations'] },
                                    { name: 'Google Drive', permissions: ['Access, organize, and manage your files', 'Upload, download, and share files', 'Create folders and manage file permissions'] },
                                    { name: 'Google Tasks', permissions: ['Read, create, update, and complete tasks', 'Manage task lists and due dates', 'Access task metadata'] },
                                    { name: 'Google Keep', permissions: ['Read, create, edit, and delete notes', 'Manage labels and reminders', 'Access note attachments and drawings'] },
                                    { name: 'Google Forms', permissions: ['Create, edit, and manage forms', 'Access form responses and analytics', 'Share and distribute forms'] }
                                ].map((service, index) => (
                                    <div key={index} className="p-4 bg-muted/50 rounded-lg border border-border">
                                        <h4 className="font-semibold text-foreground mb-2">
                                            {service.name}
                                        </h4>
                                        <ul className="text-sm space-y-1">
                                            {service.permissions.map((permission, pIndex) => (
                                                <li key={pIndex} className="flex items-start gap-2">
                                                    <span className="text-primary mt-2">•</span>
                                                    <span>{permission}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Usage Information</h3>
                            <p>I automatically collect certain information about your use of the Service:</p>
                            <ul className="space-y-2">
                                <li>Device information (type, operating system, browser)</li>
                                <li>IP address and general location data</li>
                                <li>Usage patterns and feature interactions</li>
                                <li>Error logs and performance data</li>
                            </ul>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">How I Use Your Information</h2>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-3">Core Functionality</h3>
                                    <ul className="space-y-2">
                                        <li>Provide AI-powered assistance for your requested tasks</li>
                                        <li>Execute actions on your behalf across your connected Google services</li>
                                        <li>Process natural language commands and queries</li>
                                        <li>Maintain conversation context and history</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-3">Service Improvement</h3>
                                    <ul className="space-y-2">
                                        <li>Enhance AI model performance and accuracy</li>
                                        <li>Develop new features and capabilities</li>
                                        <li>Troubleshoot technical issues</li>
                                        <li>Analyze usage patterns for optimization</li>
                                    </ul>
                                </div>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Data Sharing</h2>
                            <p>As a personal side project, I keep data sharing to a minimum:</p>

                            <div className="space-y-4 mt-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">AI Service Providers</h3>
                                    <p>I share your messages with AI service providers (such as OpenAI, Google Gemini) to process your requests and provide responses. These providers have their own data protection policies.</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">No Commercial Sharing</h3>
                                    <p>I don't sell, rent, or share your personal information for commercial purposes. This is a hobby project, not a business.</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Legal Requirements</h3>
                                    <p>I may disclose information if required by law or to protect the safety and security of users.</p>
                                </div>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Google API Services User Data Policy Compliance</h2>
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="font-semibold text-foreground mb-2">Limited Use Commitment</p>
                                <p>
                                    Nimbu AI's use and transfer of information received from Google APIs adheres to the{' '}
                                    <a href="https://developers.google.com/terms/api-services-user-data-policy"
                                        className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                                        Google API Services User Data Policy
                                    </a>, including the Limited Use requirements.
                                </p>
                            </div>

                            <div className="mt-4 space-y-3">
                                <h3 className="text-lg font-semibold text-foreground">I commit to:</h3>
                                <ul className="space-y-2">
                                    <li>Only request access to Google user data that is necessary for Nimbu AI's functionality</li>
                                    <li>Not use Google user data for serving advertisements</li>
                                    <li>Not allow humans to read user data unless explicit consent is given or it's necessary for security purposes</li>
                                    <li>Not transfer Google user data to third parties except as disclosed in this policy</li>
                                    <li>Not use or transfer Google user data for determining creditworthiness or for lending purposes</li>
                                </ul>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Data Security</h2>
                            <p>As a personal project, I implement reasonable security measures to protect your information:</p>

                            <div className="grid gap-3 mt-4">
                                {[
                                    { title: 'Secure Transmission', desc: 'All data is transmitted over HTTPS connections' },
                                    { title: 'Access Controls', desc: 'Only I have access to the server and user data' },
                                    { title: 'No Long-term Storage', desc: 'Google data is processed in real-time and not stored long-term' },
                                    { title: 'OAuth Security', desc: 'All Google integrations use secure OAuth 2.0 protocols' },
                                    { title: 'Open Source', desc: 'The code is public, allowing security review by the community' }
                                ].map((item, index) => (
                                    <div key={index} className="p-3 bg-muted/50 rounded-lg border text-white border-border">
                                        <span className="font-semibold text-primary">{item.title}:</span> {item.desc}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    <strong>Important:</strong> While I take security seriously, please note that this is a personal hobby project
                                    without enterprise-level security infrastructure. Use at your own discretion and avoid processing highly sensitive data.
                                </p>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Your Rights and Choices</h2>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Account Management</h3>
                                    <ul className="space-y-1">
                                        <li>Access and update your account information</li>
                                        <li>Delete your account and associated data</li>
                                        <li>Disconnect Google services integrations</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Google Services Control</h3>
                                    <ul className="space-y-1">
                                        <li>Revoke Nimbu AI's access to your Google services at any time through your Google Account settings</li>
                                        <li>Control which specific Google services are connected</li>
                                    </ul>
                                </div>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Open Source Transparency</h2>
                            <div className="p-4 bg-muted/50 border border-border rounded-lg">
                                <p>
                                    As an open-source personal project, Nimbu AI provides full transparency about how your data is processed.
                                    The source code is publicly available on GitHub, allowing anyone to verify the privacy practices,
                                    contribute improvements, or even self-host the application for complete control over their data.
                                </p>
                            </div>

                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Contact Information</h2>
                            <p>If you have any questions about this Privacy Policy, please contact me:</p>

                            <div className="mt-4 p-4 bg-card border border-border rounded-lg">
                                <ul className="space-y-2">
                                    <li><strong>Email:</strong> <a href="mailto:heyhexadecimal@gmail.com" className="text-primary hover:underline">heyhexadecimal@gmail.com</a></li>
                                    <li><strong>GitHub:</strong> <a href="https://github.com/heyhexadecimal/nimbu-ai" className="text-primary hover:underline">https://github.com/heyhexadecimal/nimbu-ai</a></li>
                                    <li><strong>Website:</strong> <a href="https://nimbuai.com" className="text-primary hover:underline">https://nimbuai.com</a></li>
                                </ul>
                            </div>

                            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    <strong>Legal Notice:</strong> This Privacy Policy is designed to comply with GDPR, CCPA, and Google API Services User Data Policy requirements.
                                    Please consult with legal counsel to ensure compliance with all applicable laws in your jurisdiction.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}